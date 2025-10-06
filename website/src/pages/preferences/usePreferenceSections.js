/**
 * 背景：
 *  - Preferences 先前将数据获取、标签编排与展示布局耦合在单一组件中，导致模态与页面难以复用。
 * 目的：
 *  - 抽离复合逻辑为可复用的 hook，集中维护分区元数据、状态与副作用，便于 SettingsModal 与页面共享。
 * 关键决策与取舍：
 *  - 采用组合 + 策略模式：hook 返回 Section 组件与其属性，调用方按需决定排布；拒绝简单对象返回，确保后续扩展编辑态或异步加载时具备足够语义空间。
 * 影响范围：
 *  - 偏好设置模态与页面的导航、状态切换、文案均改由本 hook 驱动。
 * 演进与TODO：
 *  - TODO: 当新增分区或引入懒加载时，可在此处扩展蓝图数组或接入数据缓存策略。
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useLanguage, useUser } from "@/context";
import AccountSection from "./sections/AccountSection.jsx";
import { ACCOUNT_USERNAME_FIELD_TYPE } from "./sections/accountSection.constants.js";
import DataSection from "./sections/DataSection.jsx";
import GeneralSection from "./sections/GeneralSection.jsx";
import KeyboardSection from "./sections/KeyboardSection.jsx";
import ResponseStyleSection from "./sections/ResponseStyleSection.jsx";
import SubscriptionSection from "./sections/SubscriptionSection.jsx";
import { buildSubscriptionSectionProps } from "./sections/subscriptionBlueprint.js";
import useAvatarEditorWorkflow from "@/hooks/useAvatarEditorWorkflow.js";
import useEmailBinding from "@/hooks/useEmailBinding.js";
import { useUsersApi } from "@/api/users.js";
import { useProfilesApi } from "@/api/profiles.js";
import {
  mapResponseToProfileDetails,
  createEmptyProfileDetails,
  mapProfileDetailsToRequest,
} from "@/pages/profile/profileDetailsModel.js";
import {
  RESPONSE_STYLE_ACTIONS,
  buildRequestPayload,
  createResponseStyleInitialState,
  hasFieldChanged,
  responseStyleReducer,
} from "./sections/responseStyleModel.js";

const createIconConfig = (name) =>
  Object.freeze({
    name,
    roleClass: "inherit",
    decorative: true,
    width: 20,
    height: 20,
  });

/**
 * 关键决策与取舍：
 *  - 通过 SECTION_ICON_REGISTRY 作为轻量适配器，隔离分区蓝图与底层资产文件名，
 *    以便未来替换或按主题扩展图标时仅需更新注册表；
 *  - 保留 createIconConfig 工厂确保尺寸与语义默认值一致，避免调用方散落魔法常量。
 */
const SECTION_ICON_REGISTRY = Object.freeze({
  general: createIconConfig("cog-6-tooth"),
  responseStyle: createIconConfig("personalization"),
  data: createIconConfig("shield-check"),
  keyboard: createIconConfig("command-line"),
  account: createIconConfig("user"),
  subscription: createIconConfig("subscription"),
});

const FALLBACK_MODAL_HEADING_ID = "settings-modal-fallback-heading";

const sanitizeActiveSectionId = (candidateId, sections) => {
  if (!sections || sections.length === 0) {
    return "";
  }
  const fallback = sections.find((section) => !section.disabled) ?? sections[0];
  if (!candidateId) {
    return fallback.id;
  }
  const matched = sections.find(
    (section) => section.id === candidateId && !section.disabled,
  );
  return matched ? matched.id : fallback.id;
};

const mapToDisplayValue = (candidate, fallbackValue) => {
  if (candidate === null || candidate === undefined) {
    return fallbackValue;
  }
  if (typeof candidate === "string" && candidate.trim().length === 0) {
    return fallbackValue;
  }
  return String(candidate);
};

const pickFirstMeaningfulString = (candidates, fallbackValue = "") => {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return typeof fallbackValue === "string" ? fallbackValue.trim() : "";
};

/**
 * 意图：
 *  - 统一手机号的国际区号展示策略，保证偏好设置与后续账户模块风格一致。
 * 输入：
 *  - rawPhone: 原始手机号字符串，可能包含空格或分隔符；
 *  - fallbackValue: 当手机号缺失时展示的占位文案；
 *  - defaultCode: 缺失国际区号时自动补全的默认区号。
 * 输出：
 *  - 形如“+86 13800000000”的字符串或占位文案。
 * 流程：
 *  1) 若缺失手机号直接返回占位；
 *  2) 若存在国际区号，提取首段 `+` 开头的数字；
 *  3) 去除区号后的分隔符，仅保留数字并保留一个空格分隔。
 * 错误处理：
 *  - 输入非字符串或无法解析时回退到占位或原值。
 */
const formatPhoneDisplay = (
  rawPhone,
  { fallbackValue, defaultCode = "+86" } = {},
) => {
  const normalized = mapToDisplayValue(rawPhone, fallbackValue);
  if (normalized === fallbackValue) {
    return fallbackValue;
  }

  if (typeof normalized !== "string") {
    return normalized;
  }

  const trimmed = normalized.trim();
  if (trimmed.length === 0) {
    return fallbackValue;
  }

  const withCode = trimmed.startsWith("+")
    ? trimmed
    : `${defaultCode} ${trimmed.replace(/\s+/g, " ").trim()}`;

  const match = withCode.match(/^(\+\d{1,4})([\s-]?)(.*)$/);
  if (!match) {
    return withCode;
  }

  const [, code, , numberPart] = match;
  const digits = numberPart.replace(/[^0-9]/g, "");
  if (!digits) {
    return code;
  }
  return `${code} ${digits}`;
};

/**
 * 意图：
 *  - 生成偏好设置分区蓝图，统一管理激活分区、表头文案与账户数据。
 * 输入：
 *  - initialSectionId: 初始分区标识。
 * 输出：
 *  - 包含文案、分区数组、激活态控制与表单守卫的组合对象。
 * 流程：
 *  1) 汇总用户上下文与翻译词条并构造账户字段、头像与绑定占位信息。
 *  2) 结合国际化词条组装分区蓝本。
 *  3) 管理激活分区的受控状态并暴露切换方法。
 * 错误处理：
 *  - 当前仅依赖本地状态，若上下文缺失则自动回退至占位文案。
 * 复杂度：
 *  - 时间：O(n) 取决于分区数量；空间：O(1) 额外状态。
 */
function usePreferenceSections({ initialSectionId }) {
  const { t } = useLanguage();
  const userStore = useUser();
  const { user, setUser } = userStore ?? {};
  const usersApi = useUsersApi();
  const updateUsernameRequest = usersApi?.updateUsername;
  const emailBinding = useEmailBinding({
    user,
    onUserUpdate: setUser,
    apiClient: usersApi,
  });
  const {
    unbindEmail: performEmailUnbind,
    isUnbinding: isEmailUnbinding,
    startEditing: beginEmailRebinding,
  } = emailBinding ?? {};
  const profilesApi = useProfilesApi();
  const fetchProfile = profilesApi?.fetchProfile;
  const saveProfileRequest = profilesApi?.saveProfile;

  const avatarEditorLabels = useMemo(
    () => ({
      title: t.avatarEditorTitle ?? "调整头像位置",
      description:
        t.avatarEditorDescription ??
        "拖动图片以确认正方向，放大后可观察正方形及其内切圆的呈现。",
      zoomIn: t.avatarZoomIn ?? "放大",
      zoomOut: t.avatarZoomOut ?? "缩小",
      cancel: t.avatarCancel ?? "取消",
      confirm: t.avatarConfirm ?? "确认",
    }),
    [
      t.avatarCancel,
      t.avatarConfirm,
      t.avatarEditorDescription,
      t.avatarEditorTitle,
      t.avatarZoomIn,
      t.avatarZoomOut,
    ],
  );

  const handleAvatarUploadError = useCallback((error) => {
    console.error("Failed to upload avatar from preferences", error);
  }, []);

  const {
    selectAvatar: handleAvatarSelection,
    modalProps: avatarEditorModalProps,
    isBusy: isAvatarUploading,
  } = useAvatarEditorWorkflow({
    labels: avatarEditorLabels,
    uploaderOptions: { onError: handleAvatarUploadError },
  });

  const [responseStyleState, dispatchResponseStyle] = useReducer(
    responseStyleReducer,
    undefined,
    createResponseStyleInitialState,
  );
  const profileDetailsRef = useRef(createEmptyProfileDetails());

  const headingId = "settings-heading";
  const description = t.prefDescription ?? "";
  const hasDescription = Boolean(description && description.trim());
  const descriptionId = hasDescription ? "settings-description" : undefined;
  const fallbackValue = t.settingsEmptyValue ?? "—";
  const tablistLabel = t.prefTablistLabel ?? "Preference sections";
  const closeLabel = t.close ?? "Close";
  const modalTitle = t.prefTitle ?? "Preferences";

  const planLabel = useMemo(() => {
    if (!user) {
      return "";
    }
    const candidate =
      (typeof user.plan === "string" && user.plan.trim()) ||
      (user.isPro ? "plus" : "");
    if (!candidate) {
      return "";
    }
    const normalized = candidate.trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [user]);

  const changeAvatarLabel = t.changeAvatar ?? "Change avatar";
  const accountBindingsTitle =
    t.settingsAccountBindingTitle ?? "Connected accounts";
  const accountBindingStatus =
    t.settingsAccountBindingStatusUnlinked ?? "Not linked";
  const accountBindingActionLabel =
    t.settingsAccountBindingActionPlaceholder ?? "Coming soon";

  const responseStyleCopy = useMemo(
    () => ({
      loadingLabel: t.loading ?? t.saving ?? "Loading...",
      savingLabel: t.saving ?? "Saving...",
      errorLabel:
        t.settingsResponseStyleError ??
        t.fail ??
        "Unable to load response preferences",
      retryLabel: t.refresh ?? "Refresh",
      dropdownLabel: t.responseStyleSelectLabel ?? "Response tone",
      options: [
        {
          value: "default",
          label: t.responseStyleOptionDefault ?? "Default",
          description:
            t.responseStyleOptionDefaultDescription ?? "Cheerful and adaptive",
        },
        {
          value: "cynic",
          label: t.responseStyleOptionCynic ?? "Cynic",
          description:
            t.responseStyleOptionCynicDescription ?? "Critical and sarcastic",
        },
        {
          value: "robot",
          label: t.responseStyleOptionRobot ?? "Robot",
          description:
            t.responseStyleOptionRobotDescription ?? "Efficient and blunt",
        },
        {
          value: "listener",
          label: t.responseStyleOptionListener ?? "Listener",
          description:
            t.responseStyleOptionListenerDescription ??
            "Thoughtful and supportive",
        },
        {
          value: "nerd",
          label: t.responseStyleOptionNerd ?? "Nerd",
          description:
            t.responseStyleOptionNerdDescription ??
            "Exploratory and enthusiastic",
        },
      ],
      fields: [
        {
          id: "job",
          label: t.responseStyleFieldJobLabel ?? t.jobLabel ?? "Occupation",
          placeholder: t.responseStyleFieldJobPlaceholder ?? "",
        },
        {
          id: "education",
          label:
            t.responseStyleFieldEducationLabel ??
            t.educationLabel ??
            "Education",
          placeholder: t.responseStyleFieldEducationPlaceholder ?? "",
        },
        {
          id: "currentAbility",
          label:
            t.responseStyleFieldAbilityLabel ??
            t.currentAbilityLabel ??
            "Current ability",
          placeholder: t.responseStyleFieldAbilityPlaceholder ?? "",
        },
        {
          id: "goal",
          label: t.responseStyleFieldGoalLabel ?? t.goalLabel ?? "Goal",
          placeholder: t.responseStyleFieldGoalPlaceholder ?? "",
          multiline: true,
          rows: 3,
        },
        {
          id: "interests",
          label:
            t.responseStyleFieldInterestsLabel ??
            t.interestsLabel ??
            "Interests",
          placeholder: t.responseStyleFieldInterestsPlaceholder ?? "",
          multiline: true,
          rows: 3,
        },
      ],
    }),
    [
      t.currentAbilityLabel,
      t.educationLabel,
      t.fail,
      t.goalLabel,
      t.interestsLabel,
      t.loading,
      t.refresh,
      t.responseStyleFieldAbilityLabel,
      t.responseStyleFieldAbilityPlaceholder,
      t.responseStyleFieldEducationLabel,
      t.responseStyleFieldEducationPlaceholder,
      t.responseStyleFieldGoalLabel,
      t.responseStyleFieldGoalPlaceholder,
      t.responseStyleFieldInterestsLabel,
      t.responseStyleFieldInterestsPlaceholder,
      t.responseStyleFieldJobLabel,
      t.jobLabel,
      t.responseStyleFieldJobPlaceholder,
      t.responseStyleOptionCynic,
      t.responseStyleOptionCynicDescription,
      t.responseStyleOptionDefault,
      t.responseStyleOptionDefaultDescription,
      t.responseStyleOptionListener,
      t.responseStyleOptionListenerDescription,
      t.responseStyleOptionNerd,
      t.responseStyleOptionNerdDescription,
      t.responseStyleOptionRobot,
      t.responseStyleOptionRobotDescription,
      t.responseStyleSelectLabel,
      t.saving,
      t.settingsResponseStyleError,
    ],
  );

  const requestResponseStyle = useCallback(
    async ({ signal, withLoading = true } = {}) => {
      const abortRequested = () => Boolean(signal?.aborted);
      const safeDispatch = (action) => {
        if (!abortRequested()) {
          dispatchResponseStyle(action);
        }
      };

      if (!user?.token || typeof fetchProfile !== "function") {
        profileDetailsRef.current = createEmptyProfileDetails();
        safeDispatch({
          type: RESPONSE_STYLE_ACTIONS.hydrate,
          payload: profileDetailsRef.current,
        });
        return;
      }

      if (withLoading) {
        safeDispatch({ type: RESPONSE_STYLE_ACTIONS.loading });
      }

      try {
        const response = await fetchProfile({ token: user.token });
        if (abortRequested()) {
          return;
        }
        const details = mapResponseToProfileDetails(response);
        profileDetailsRef.current = details;
        safeDispatch({
          type: RESPONSE_STYLE_ACTIONS.hydrate,
          payload: details,
        });
      } catch (error) {
        console.error("Failed to load response style preferences", error);
        if (abortRequested()) {
          return;
        }
        safeDispatch({ type: RESPONSE_STYLE_ACTIONS.failure, error });
      }
    },
    [dispatchResponseStyle, fetchProfile, user?.token],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestResponseStyle({ signal: controller.signal });
    return () => controller.abort();
  }, [requestResponseStyle]);

  const handleResponseStyleRetry = useCallback(() => {
    requestResponseStyle({ withLoading: true });
  }, [requestResponseStyle]);

  const handleResponseStyleChange = useCallback(
    (field, value) => {
      dispatchResponseStyle({
        type: RESPONSE_STYLE_ACTIONS.change,
        field,
        value,
      });
      dispatchResponseStyle({ type: RESPONSE_STYLE_ACTIONS.clearError });
    },
    [dispatchResponseStyle],
  );

  const handleResponseStyleCommit = useCallback(
    async (field) => {
      if (!hasFieldChanged(responseStyleState, field)) {
        const normalized = (responseStyleState.values[field] ?? "").trim();
        profileDetailsRef.current = {
          ...profileDetailsRef.current,
          [field]: normalized,
        };
        dispatchResponseStyle({
          type: RESPONSE_STYLE_ACTIONS.synchronize,
          field,
          value: normalized,
        });
        return;
      }

      if (!user?.token || typeof saveProfileRequest !== "function") {
        dispatchResponseStyle({
          type: RESPONSE_STYLE_ACTIONS.failure,
          error: new Error("response-style-save-auth-missing"),
        });
        return;
      }

      dispatchResponseStyle({
        type: RESPONSE_STYLE_ACTIONS.saving,
        field,
      });

      try {
        const mergedDetails = buildRequestPayload(
          responseStyleState,
          profileDetailsRef.current,
        );
        profileDetailsRef.current = mergedDetails;
        const payload = mapProfileDetailsToRequest(mergedDetails);
        const response = await saveProfileRequest({
          token: user.token,
          profile: payload,
        });
        const nextDetails = mapResponseToProfileDetails(response);
        profileDetailsRef.current = nextDetails;
        dispatchResponseStyle({
          type: RESPONSE_STYLE_ACTIONS.success,
          payload: nextDetails,
        });
      } catch (error) {
        console.error("Failed to save response style preferences", error);
        dispatchResponseStyle({ type: RESPONSE_STYLE_ACTIONS.failure, error });
      }
    },
    [
      dispatchResponseStyle,
      responseStyleState,
      saveProfileRequest,
      user?.token,
    ],
  );

  const subscriptionSection = useMemo(
    () =>
      buildSubscriptionSectionProps({
        translations: t,
        user,
      }),
    [t, user],
  );

  /**
   * 关键决策与取舍：
   *  - 借助 memoized snapshot 统一收敛账户字段的展示值，确保后续扩展编辑态或批量更新时
   *    只需调整此处逻辑即可；
   *  - 同步沉淀 hasBoundEmail 等派生状态，避免在渲染阶段重复解析用户数据导致交互状态与业务判定脱节；
   *  - 备选方案是分散在 useMemo 之外逐项计算，但会让 `sections` 依赖列表不断膨胀且难以追踪。
   */
  const accountFieldSnapshot = useMemo(() => {
    const sanitizedUsernameCandidate =
      typeof user?.username === "string" ? user.username.trim() : "";
    const hasBoundEmail =
      typeof user?.email === "string" && user.email.trim().length > 0;

    return Object.freeze({
      sanitizedUsername: sanitizedUsernameCandidate,
      usernameValue: mapToDisplayValue(
        sanitizedUsernameCandidate,
        fallbackValue,
      ),
      emailValue: mapToDisplayValue(user?.email, fallbackValue),
      phoneValue: formatPhoneDisplay(user?.phone, {
        fallbackValue,
        defaultCode: t.settingsAccountDefaultPhoneCode ?? "+86",
      }),
      hasBoundEmail,
    });
  }, [fallbackValue, t.settingsAccountDefaultPhoneCode, user]);

  const {
    sanitizedUsername,
    usernameValue,
    emailValue,
    phoneValue,
    hasBoundEmail,
  } = accountFieldSnapshot;

  /**
   * 意图：以命令对象形式封装解绑邮箱流程，避免展示层直接依赖底层 Hook 并利于未来扩展确认弹窗。
   * 输入：无显式入参（依赖闭包中的 hasBoundEmail 与 performEmailUnbind）。
   * 输出：Promise —— 解绑完成后的异步链路。
   * 流程：
   *  1) 若当前无邮箱则直接返回，保持幂等；
   *  2) 调用 useEmailBinding 暴露的 unbindEmail 完成后端交互；
   *  3) 若 Hook 提供 startEditing，复位状态以支持后续换绑；
   *  4) 捕获异常并记录日志，避免静默失败。
   * 错误处理：记录结构化错误日志，供后续可观测性接入扩展。
   * 复杂度：O(1)。
   */
  const handleEmailUnbind = useCallback(async () => {
    if (!hasBoundEmail) {
      return;
    }

    if (typeof performEmailUnbind !== "function") {
      console.error("Email unbind command unavailable in preferences context");
      return;
    }

    try {
      await performEmailUnbind();
      if (typeof beginEmailRebinding === "function") {
        beginEmailRebinding();
      }
    } catch (error) {
      console.error("Failed to unbind email from preferences", error);
    }
  }, [beginEmailRebinding, hasBoundEmail, performEmailUnbind]);

  const usernameEditorTranslations = useMemo(
    () => ({
      usernamePlaceholder:
        t.usernamePlaceholder ?? t.settingsAccountUsername ?? "Enter username",
      changeUsernameButton:
        t.changeUsernameButton ?? t.settingsManageProfile ?? "Change username",
      saveUsernameButton: t.saveUsernameButton ?? "Save username",
      saving: t.saving ?? "Saving...",
      usernameValidationEmpty:
        t.usernameValidationEmpty ?? "Username cannot be empty",
      usernameValidationTooShort:
        t.usernameValidationTooShort ?? "Username is too short",
      usernameValidationTooLong:
        t.usernameValidationTooLong ?? "Username is too long",
      usernameUpdateFailed:
        t.usernameUpdateFailed ?? "Unable to update username",
    }),
    [
      t.changeUsernameButton,
      t.saving,
      t.saveUsernameButton,
      t.settingsAccountUsername,
      t.settingsManageProfile,
      t.usernamePlaceholder,
      t.usernameValidationEmpty,
      t.usernameValidationTooLong,
      t.usernameValidationTooShort,
      t.usernameUpdateFailed,
    ],
  );

  const handleUsernameFailure = useCallback((error) => {
    console.error("Failed to update username from preferences", error);
  }, []);

  const handleUsernameSubmit = useCallback(
    async (nextUsername) => {
      if (!user?.id || !user?.token) {
        throw new Error("User session is unavailable");
      }

      if (typeof updateUsernameRequest !== "function") {
        if (typeof setUser === "function") {
          setUser({ ...user, username: nextUsername });
        }
        return nextUsername;
      }

      const response = await updateUsernameRequest({
        userId: user.id,
        username: nextUsername,
        token: user.token,
      });

      const resolvedUsername =
        typeof response?.username === "string"
          ? response.username
          : nextUsername;

      if (typeof setUser === "function") {
        setUser({ ...user, username: resolvedUsername });
      }

      return resolvedUsername;
    },
    [setUser, updateUsernameRequest, user],
  );

  const sections = useMemo(() => {
    const generalLabel = t.settingsTabGeneral ?? "General";

    const responseStyleLabel = t.settingsTabPersonalization ?? "Response style";
    const responseStyleSummary =
      t.settingsResponseStyleDescription ??
      t.prefPersonalizationTitle ??
      "Choose how explanations should sound.";
    const responseStyleMessage = pickFirstMeaningfulString(
      [t.settingsResponseStyleDescription, t.prefPersonalizationTitle],
      responseStyleSummary,
    );

    const dataLabel = t.settingsTabData ?? "Data controls";
    const dataSummary =
      t.settingsDataDescription ??
      "Manage how Glancy stores and purges your historical traces.";
    const dataMessage = pickFirstMeaningfulString(
      [t.settingsDataNotice, t.settingsDataDescription],
      dataSummary,
    );

    const keyboardLabel = t.settingsTabKeyboard ?? "Keyboard shortcuts";
    // 键盘分区根据最新交互规范仅暴露标题，摘要信息交由上下文提示（hint）呈现。

    const accountLabel =
      t.prefAccountTitle ?? t.settingsTabAccount ?? "Account";
    const emailUnbindAction = {
      id: "unbind-email",
      label:
        t.settingsAccountEmailUnbindAction ??
        t.settingsAccountEmailUnbind ??
        "Unbind email",
      // 将可操作性与真实绑定态同步，避免展示“解绑”却无法点击的交互悖论。
      disabled: !hasBoundEmail,
      onClick: handleEmailUnbind,
      isPending: Boolean(isEmailUnbinding),
      pendingLabel:
        t.settingsAccountEmailUnbinding ?? t.emailUnbinding ?? "Removing…",
    };
    const phoneRebindAction = {
      id: "rebind-phone",
      label: t.settingsAccountPhoneRebindAction ?? "Change phone",
      disabled: true,
    };

    const accountFields = [
      {
        id: "username",
        label: t.settingsAccountUsername ?? "Username",
        value: usernameValue,
        type: ACCOUNT_USERNAME_FIELD_TYPE,
        usernameEditorProps: {
          username: sanitizedUsername,
          emptyDisplayValue: fallbackValue,
          t: usernameEditorTranslations,
          onSubmit: handleUsernameSubmit,
          onFailure: handleUsernameFailure,
        },
      },
      {
        id: "email",
        label: t.settingsAccountEmail ?? "Email",
        value: emailValue,
        action: emailUnbindAction,
      },
      {
        id: "phone",
        label: t.settingsAccountPhone ?? "Phone",
        value: phoneValue,
        action: phoneRebindAction,
      },
    ];

    const accountIdentity = {
      label: t.settingsAccountAvatarLabel ?? "Avatar",
      displayName: usernameValue,
      changeLabel: changeAvatarLabel,
      avatarAlt: accountLabel,
      onSelectAvatar: handleAvatarSelection,
      isUploading: isAvatarUploading,
    };

    const accountBindings = {
      title: accountBindingsTitle,
      items: [
        {
          id: "apple",
          name: t.settingsAccountBindingApple ?? "Apple",
          status: accountBindingStatus,
          actionLabel: accountBindingActionLabel,
        },
        {
          id: "google",
          name: t.settingsAccountBindingGoogle ?? "Google",
          status: accountBindingStatus,
          actionLabel: accountBindingActionLabel,
        },
        {
          id: "wechat",
          name: t.settingsAccountBindingWeChat ?? "WeChat",
          status: accountBindingStatus,
          actionLabel: accountBindingActionLabel,
        },
      ],
    };

    //
    // 导航标签仅展示主标题，摘要内容由具体面板负责渲染，避免屏幕阅读器重复朗读。
    return [
      {
        id: "general",
        label: generalLabel,
        disabled: false,
        Component: GeneralSection,
        componentProps: {
          title: generalLabel,
        },
        icon: SECTION_ICON_REGISTRY.general,
      },
      {
        id: "responseStyle",
        label: responseStyleLabel,
        disabled: false,
        Component: ResponseStyleSection,
        componentProps: {
          title: responseStyleLabel,
          message: responseStyleMessage,
          state: responseStyleState,
          copy: responseStyleCopy,
          onRetry: handleResponseStyleRetry,
          onFieldChange: handleResponseStyleChange,
          onFieldCommit: handleResponseStyleCommit,
        },
        icon: SECTION_ICON_REGISTRY.responseStyle,
      },
      {
        id: "data",
        label: dataLabel,
        disabled: false,
        Component: DataSection,
        componentProps: {
          title: dataLabel,
          message: dataMessage,
        },
        icon: SECTION_ICON_REGISTRY.data,
      },
      {
        id: "keyboard",
        label: keyboardLabel,
        disabled: false,
        Component: KeyboardSection,
        componentProps: {
          title: keyboardLabel,
        },
        icon: SECTION_ICON_REGISTRY.keyboard,
      },
      {
        id: "account",
        label: accountLabel,
        disabled: false,
        Component: AccountSection,
        componentProps: {
          title: accountLabel,
          fields: accountFields,
          identity: accountIdentity,
          bindings: accountBindings,
        },
        icon: SECTION_ICON_REGISTRY.account,
      },
      {
        id: "subscription",
        label: subscriptionSection.title,
        disabled: false,
        Component: SubscriptionSection,
        componentProps: subscriptionSection,
        icon: SECTION_ICON_REGISTRY.subscription,
      },
    ];
  }, [
    accountBindingActionLabel,
    accountBindingStatus,
    accountBindingsTitle,
    fallbackValue,
    t.settingsAccountAvatarLabel,
    t.settingsAccountEmailUnbind,
    t.settingsAccountEmailUnbindAction,
    t.settingsAccountEmailUnbinding,
    t.emailUnbinding,
    t.settingsAccountPhoneRebindAction,
    handleUsernameFailure,
    handleUsernameSubmit,
    usernameEditorTranslations,
    changeAvatarLabel,
    t.prefAccountTitle,
    t.prefPersonalizationTitle,
    t.settingsAccountBindingApple,
    t.settingsAccountBindingGoogle,
    t.settingsAccountBindingWeChat,
    t.settingsAccountEmail,
    t.settingsAccountPhone,
    t.settingsAccountUsername,
    t.settingsDataDescription,
    t.settingsDataNotice,
    t.settingsTabAccount,
    t.settingsTabData,
    t.settingsTabGeneral,
    t.settingsTabKeyboard,
    t.settingsTabPersonalization,
    t.settingsResponseStyleDescription,
    responseStyleCopy,
    responseStyleState,
    handleResponseStyleRetry,
    handleResponseStyleChange,
    handleResponseStyleCommit,
    subscriptionSection,
    handleAvatarSelection,
    isAvatarUploading,
    sanitizedUsername,
    usernameValue,
    emailValue,
    phoneValue,
    hasBoundEmail,
    handleEmailUnbind,
    isEmailUnbinding,
  ]);

  const [activeSectionId, setActiveSectionId] = useState(() =>
    sanitizeActiveSectionId(initialSectionId, sections),
  );
  const hasAppliedInitialRef = useRef(false);
  const previousInitialRef = useRef(initialSectionId);
  const previousSanitizedInitialRef = useRef(
    sanitizeActiveSectionId(initialSectionId, sections),
  );

  useEffect(() => {
    setActiveSectionId((current) => {
      const sanitized = sanitizeActiveSectionId(current, sections);
      return sanitized === current ? current : sanitized;
    });
  }, [sections]);

  useEffect(() => {
    const nextInitial = sanitizeActiveSectionId(initialSectionId, sections);
    const initialChanged = previousInitialRef.current !== initialSectionId;
    const sanitizedChanged =
      previousSanitizedInitialRef.current !== nextInitial;
    const shouldSync =
      !hasAppliedInitialRef.current || initialChanged || sanitizedChanged;

    if (!shouldSync) {
      return undefined;
    }

    hasAppliedInitialRef.current = true;
    previousInitialRef.current = initialSectionId;
    previousSanitizedInitialRef.current = nextInitial;

    setActiveSectionId((current) =>
      current === nextInitial ? current : nextInitial,
    );

    return undefined;
  }, [initialSectionId, sections]);

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  const handleSectionSelect = useCallback((section) => {
    if (!section || section.disabled) {
      return;
    }
    setActiveSectionId((current) =>
      current === section.id ? current : section.id,
    );
  }, []);

  const handleSubmit = useCallback((event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
  }, []);

  const panelId = activeSection ? `${activeSection.id}-panel` : "";
  const tabId = activeSection ? `${activeSection.id}-tab` : "";
  const panelHeadingId = activeSection
    ? `${activeSection.id}-section-heading`
    : "";
  const shouldExposePanelDescription = Boolean(
    activeSection &&
      typeof activeSection.componentProps?.message === "string" &&
      activeSection.componentProps.message.trim().length > 0,
  );
  const panelDescriptionId = shouldExposePanelDescription
    ? `${activeSection.id}-section-description`
    : undefined;

  const resolvedModalHeadingText = pickFirstMeaningfulString(
    [activeSection?.componentProps?.title, activeSection?.label],
    modalTitle,
  );
  const focusHeadingId = panelHeadingId || FALLBACK_MODAL_HEADING_ID;

  return {
    copy: {
      title: modalTitle,
      description,
      tablistLabel,
      closeLabel,
    },
    header: {
      headingId,
      descriptionId,
      planLabel,
    },
    sections,
    activeSection,
    activeSectionId,
    handleSectionSelect,
    handleSubmit,
    panel: {
      panelId,
      tabId,
      headingId: panelHeadingId,
      descriptionId: panelDescriptionId,
      focusHeadingId,
      modalHeadingId: FALLBACK_MODAL_HEADING_ID,
      modalHeadingText: resolvedModalHeadingText,
    },
    avatarEditor: {
      modalProps: avatarEditorModalProps,
    },
  };
}

export default usePreferenceSections;
