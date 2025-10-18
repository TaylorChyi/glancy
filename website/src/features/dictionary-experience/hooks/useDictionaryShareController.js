/**
 * 背景：
 *  - 分享相关逻辑与查询流程耦合在同一 Hook 内，不利于在移动端等场景复用。
 * 目的：
 *  - 以门面模式封装分享链接/长图导出的副作用，隔离弹窗、剪贴板与导出任务细节。
 * 关键决策与取舍：
 *  - 将分享状态（链接生成、长图导出）集中在此，主 Hook 仅感知高层语义；
 *  - 采用纯粹的输入参数，便于单测通过依赖注入方式覆盖不同场景。
 * 影响范围：
 *  - DictionaryExperience 工具栏分享按钮；未来若有独立分享面板亦可直接复用。
 * 演进与TODO：
 *  - 后续可在此引入埋点或失败重试机制，保持调用侧无感。
 */
import { useCallback, useMemo, useState } from "react";
import { resolveShareTarget, copyTextToClipboard } from "@shared/utils";
import { exportDictionaryShareImage } from "../share/dictionaryShareImage.js";

/**
 * 意图：提供统一的分享控制器，管理链接复制与长图导出。
 * 输入：
 *  - activeTerm：当前词条；
 *  - entry/finalText：词条内容来源；
 *  - activeVersionId、dictionaryTargetLanguage：生成分享链接所需上下文；
 *  - t：国际化字典；
 *  - user/showPopup：用户信息与提示回调。
 * 输出：分享链接、导出状态与对应的触发器。
 * 流程：
 *  1) 根据当前词条计算分享链接；
 *  2) 执行链接复制或长图导出，并给出成功/失败提示；
 *  3) 管理导出中的状态避免重复触发。
 * 错误处理：捕获剪贴板/导出异常并回退状态。
 * 复杂度：O(1)。
 */
export function useDictionaryShareController({
  activeTerm,
  entry,
  finalText,
  activeVersionId,
  dictionaryTargetLanguage,
  t,
  user,
  showPopup,
}) {
  const [shareImageState, setShareImageState] = useState("idle");

  const shareUrl = useMemo(() => {
    if (!activeTerm) return "";
    const currentUrl =
      typeof window !== "undefined" && window.location
        ? window.location.href
        : "";
    return resolveShareTarget({
      currentUrl,
      term: activeTerm,
      language: dictionaryTargetLanguage,
      versionId: activeVersionId,
    });
  }, [activeTerm, dictionaryTargetLanguage, activeVersionId]);

  const handleShareLinkCopy = useCallback(async () => {
    if (!activeTerm) return;
    const targetUrl = shareUrl;
    const fallbackMessage = t.shareFailed ?? t.share ?? activeTerm;
    if (!targetUrl) {
      showPopup(fallbackMessage);
      return;
    }

    try {
      const result = await copyTextToClipboard(targetUrl);
      if (result.status === "copied") {
        const successMessage =
          t.shareCopySuccess ?? t.shareSuccess ?? t.share ?? activeTerm;
        showPopup(successMessage);
      } else {
        showPopup(fallbackMessage);
      }
    } catch (error) {
      console.error("[DictionaryExperience] share link copy failed", error);
      showPopup(fallbackMessage);
    }
  }, [
    activeTerm,
    shareUrl,
    showPopup,
    t.shareCopySuccess,
    t.shareSuccess,
    t.share,
    t.shareFailed,
  ]);

  const handleShareImageExport = useCallback(async () => {
    if (!activeTerm) return;
    if (shareImageState === "pending") return;
    if (!entry && !finalText) {
      const failureMessage = t.shareImageFailed ?? t.shareFailed ?? t.share;
      showPopup(failureMessage ?? activeTerm);
      return;
    }

    const preparingMessage = t.shareImagePreparing;
    try {
      setShareImageState("pending");
      if (preparingMessage) {
        showPopup(preparingMessage);
      }
      const result = await exportDictionaryShareImage({
        term: activeTerm,
        entry,
        finalText,
        t,
        user,
        appName: t.shareAppName ?? "Glancy",
      });

      if (result.status === "success") {
        const successMessage =
          t.shareImageSuccess ?? t.shareSuccess ?? t.share ?? activeTerm;
        showPopup(successMessage);
      } else if (result.status === "empty") {
        const failureMessage = t.shareImageFailed ?? t.shareFailed ?? t.share;
        showPopup(failureMessage ?? activeTerm);
      }
    } catch (error) {
      console.error("[DictionaryExperience] share image export failed", error);
      const failureMessage = t.shareImageFailed ?? t.shareFailed ?? t.share;
      showPopup(failureMessage ?? activeTerm);
    } finally {
      setShareImageState("idle");
    }
  }, [
    activeTerm,
    entry,
    finalText,
    shareImageState,
    showPopup,
    t,
    user,
  ]);

  return {
    shareUrl,
    shareImageState,
    handleShareLinkCopy,
    handleShareImageExport,
  };
}
