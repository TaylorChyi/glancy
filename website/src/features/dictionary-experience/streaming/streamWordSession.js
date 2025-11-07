import { normalizeMarkdownEntity } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";

const DEFAULT_LOGGER = console;

/**
 * 意图：在不抛出异常的前提下尝试解析 JSON，保持对流式返回的韧性。
 * 输入：可能是字符串或对象的 JSON 表达。
 * 输出：成功时返回对象/数组，失败时返回 null。
 * 流程：
 *  1) 判空与类型过滤。
 *  2) 字符串走 JSON.parse，失败吞掉异常。
 * 错误处理：仅在解析失败时返回 null，避免影响主流程。
 * 复杂度：O(n)，受 JSON.parse 影响。
 */
const safeParseJson = (input) => {
  if (input == null) return null;
  if (typeof input !== "string") {
    if (typeof input === "object") return input;
    return null;
  }
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

class SessionState {
  constructor(session) {
    this.session = session;
  }
}

class IdleState extends SessionState {
  /**
   * 意图：为首个有效状态创建明确入口，便于未来在启动前插入鉴权或指标采集。
   */
  createNext() {
    return new AccumulatingState(this.session);
  }
}

class AccumulatingState extends SessionState {
  constructor(session) {
    super(session);
    this.rawPayload = "";
    this.metadataPayload = null;
    this.hasCompleted = false;
  }

  /**
   * 意图：驱动底层 SSE API，累积文本 chunk 与 metadata 事件。
   * 输入：无，复用 session request。
   * 输出：逐个 chunk 的流式结果，并在完成时记录累积数据。
   * 流程：
   *  1) 调用 streamWord API，监听 metadata 与 chunk。
   *  2) metadata 事件优先保存，chunk 事件追加并向上游透传。
   * 错误处理：交由 session.stream 统一捕获。
   * 复杂度：O(n)，n 为 chunk 长度；额外的字符串连接不会逃逸。
   */
  async *collect() {
    const { request, dependencies } = this.session;
    const { streamWordApi, logger } = dependencies;
    for await (const event of streamWordApi({
      userId: request.userId,
      term: request.term,
      language: request.language,
      model: request.model,
      flavor: request.flavor,
      token: request.token,
      signal: request.signal,
      forceNew: request.forceNew,
      versionId: request.versionId,
      captureHistory: request.captureHistory,
      onChunk: (chunk) => {
        // 关键步骤：将底层 chunk 日志留在此状态，替代方案是由外部 Hook 统一记录，但那会导致重复的日志格式处理逻辑。
        logger.info("[StreamWordSession] chunk", {
          userId: request.userId,
          term: request.term,
          chunk,
        });
      },
    })) {
      if (event?.type === "metadata") {
        this.metadataPayload = event.data;
        continue;
      }
      const chunk = event?.data ?? "";
      this.rawPayload += chunk;
      yield { chunk, language: request.language };
    }
    this.hasCompleted = true;
  }

  getResult() {
    if (!this.hasCompleted) {
      throw new Error("AccumulatingState has not completed collection yet");
    }
    return {
      rawPayload: this.rawPayload,
      metadataPayload: this.metadataPayload,
    };
  }
}

class ParsingState extends SessionState {
  constructor(session, accumulationResult) {
    super(session);
    this.accumulationResult = accumulationResult;
  }

  /**
   * 意图：解析累积的 chunk 与 metadata，构造统一的词条实体。
   * 输入：累积阶段输出的原始文本与 metadata。
   * 输出：标准化后的词条对象与解析结果，供合并阶段使用。
   * 流程：
   *  1) 分别解析主 payload 与 metadata。
   *  2) 根据解析结果决定是 JSON 词条还是 markdown 词条。
   *  3) 调用 normalizer 修正结构，统一 flavor。
   * 错误处理：解析失败时回退为 markdown 词条，保持鲁棒性。
   * 复杂度：O(n)，受 JSON.parse 与 normalizer 影响。
   */
  execute() {
    const { rawPayload, metadataPayload } = this.accumulationResult;
    const { request, dependencies } = this.session;
    const parsedEntry = safeParseJson(rawPayload);
    const metadata = safeParseJson(metadataPayload);
    const entryBase =
      parsedEntry && typeof parsedEntry === "object"
        ? parsedEntry
        : {
            term: request.term,
            language: request.language,
            markdown: rawPayload,
          };
    const normalizedEntryBase = dependencies.normalize(entryBase);
    const entryFlavor =
      normalizedEntryBase.flavor ?? metadata?.flavor ?? request.flavor;
    const entry = {
      ...normalizedEntryBase,
      flavor: entryFlavor,
    };
    return {
      entry,
      metadata,
      parsedEntry,
    };
  }
}

class MergingState extends SessionState {
  constructor(session, parsingResult) {
    super(session);
    this.parsingResult = parsingResult;
  }

  /**
   * 意图：整合不同来源的版本信息，并生成最终存储所需的 payload。
   * 输入：ParsingState 输出的词条实体、metadata、原始 JSON。
   * 输出：包含 versions、metadata 与 activeVersionId 的结构化结果。
   * 流程：
   *  1) 优先使用 metadata.versions，其次退回 JSON 中的 versions，最后兜底当前 entry。
   *  2) 依据版本 ID 进行归并，确保最新 entry 覆盖相同版本。
   *  3) 生成存储 metadata，剔除冗余字段并补齐 flavor。
   * 错误处理：若缺失版本信息则退化为单版本列表。
   * 复杂度：O(m)，m 为版本数量，所有转换均在内存中进行。
   */
  execute() {
    const { entry, metadata, parsedEntry } = this.parsingResult;
    const { dependencies } = this.session;
    const versionsSource =
      (metadata && Array.isArray(metadata.versions) && metadata.versions) ||
      (parsedEntry &&
        Array.isArray(parsedEntry.versions) &&
        parsedEntry.versions);
    const derivedVersions =
      versionsSource && versionsSource.length > 0 ? versionsSource : [entry];
    const entryId = entry.id ?? entry.versionId;
    const applyFlavor = (version) => {
      const normalizedVersion = dependencies.normalize(version);
      return {
        ...normalizedVersion,
        flavor: normalizedVersion.flavor ?? entry.flavor,
      };
    };
    const hasEntryInVersions = derivedVersions.some(
      (version) =>
        (entryId &&
          String(version.id ?? version.versionId) === String(entryId)) ||
        version === entry,
    );
    const mergedVersions = hasEntryInVersions
      ? derivedVersions.map((version) => {
          const versionId = version.id ?? version.versionId;
          if (entryId && String(versionId) === String(entryId)) {
            return applyFlavor({ ...version, ...entry });
          }
          return applyFlavor(version);
        })
      : [...derivedVersions.map(applyFlavor), entry];
    const metadataBase =
      metadata && typeof metadata === "object"
        ? Object.fromEntries(
            Object.entries(metadata).filter(
              ([key]) => key !== "versions" && key !== "activeVersionId",
            ),
          )
        : {};
    const metaPayload = {
      ...metadataBase,
      ...(parsedEntry?.metadata ?? {}),
      flavor: entry.flavor,
    };
    const activeVersionId =
      metadata?.activeVersionId ??
      parsedEntry?.activeVersionId ??
      entry.id ??
      entry.versionId;
    return {
      versions: mergedVersions,
      metadata: metaPayload,
      activeVersionId,
    };
  }
}

class CompletedState extends SessionState {
  constructor(session, summary) {
    super(session);
    this.summary = summary;
  }

  /**
   * 意图：为结束阶段保留扩展点，未来可在此上报指标或触发订阅。
   * 替代方案：直接在 MergingState 内记录 summary，但会让状态间职责模糊。
   */
  execute() {
    return this.summary;
  }
}

export class StreamWordSession {
  constructor({ request, dependencies = {} }) {
    this.request = request;
    this.dependencies = {
      streamWordApi: dependencies.streamWordApi,
      normalize: dependencies.normalize ?? normalizeMarkdownEntity,
      logger: dependencies.logger ?? DEFAULT_LOGGER,
    };
    if (!this.dependencies.streamWordApi) {
      throw new Error("streamWordApi dependency is required");
    }
    this.logContext = { userId: request.userId, term: request.term };
    this.state = new IdleState(this);
    this.summary = null;
  }

  transitionTo(state) {
    this.state = state;
  }

  /**
   * 意图：串联各状态的执行顺序，并提供统一的异常处理与日志。
   * 输入：无，依赖构造函数传入的请求上下文。
   * 输出：逐个 chunk 的流式结果。
   * 流程：
   *  1) 从 IdleState 转入 AccumulatingState，拉取流式内容。
   *  2) 依次进入 ParsingState、MergingState、CompletedState。
   *  3) 记录开始/结束/异常日志，保证可观测性。
   * 错误处理：捕获下游异常后记录并重新抛出，由上层决定补偿策略。
   * 复杂度：主要由各状态自身复杂度决定。
   */
  async *stream() {
    const { logger } = this.dependencies;
    logger.info("[StreamWordSession] start", this.logContext);
    try {
      const accumulatingState = this.state.createNext();
      this.transitionTo(accumulatingState);
      for await (const payload of accumulatingState.collect()) {
        yield payload;
      }
      const accumulationResult = accumulatingState.getResult();
      const parsingState = new ParsingState(this, accumulationResult);
      this.transitionTo(parsingState);
      const parsingResult = parsingState.execute();
      const mergingState = new MergingState(this, parsingResult);
      this.transitionTo(mergingState);
      this.summary = mergingState.execute();
      const completedState = new CompletedState(this, this.summary);
      this.transitionTo(completedState);
      completedState.execute();
      logger.info("[StreamWordSession] end", this.logContext);
    } catch (error) {
      logger.info("[StreamWordSession] error", { ...this.logContext, error });
      throw error;
    }
  }

  /**
   * 意图：向外暴露最终写入 store 所需的数据。
   * 输入：无，要求在 stream 完整执行后调用。
   * 输出：包含 key、versions 与选项的对象。
   * 流程：直接返回合并阶段生成的 summary。
   * 错误处理：若在流式完成前调用则抛出异常，避免脏数据写入。
   */
  getStorePayload() {
    if (!this.summary) {
      throw new Error("StreamWordSession has not completed streaming yet");
    }
    return {
      key: this.request.key,
      versions: this.summary.versions,
      options: {
        activeVersionId: this.summary.activeVersionId,
        metadata: this.summary.metadata,
      },
    };
  }
}
