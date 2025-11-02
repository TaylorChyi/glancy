/**
 * 背景：
 *  - 账户分区展示值需要在多处复用，若直接散落在 Hook 中会造成重复逻辑。
 * 目的：
 *  - 输出构建账户快照与解绑命令的工具，保持展示层消费的数据一致。
 * 关键决策与取舍：
 *  - 快照保持不可变（Object.freeze），避免调用方意外修改；
 *  - 解绑命令使用命令对象形式，便于未来扩展前置校验或确认弹窗。
 */
import { useCallback } from "react";
import {
  mapToDisplayValue,
  formatPhoneDisplay,
} from "./utils/displayValues.js";

export const buildAccountSnapshot = ({
  user,
  fallbackValue,
  defaultPhoneCode,
}) => {
  const sanitizedUsername =
    typeof user?.username === "string" ? user.username.trim() : "";
  const hasBoundEmail =
    typeof user?.email === "string" && user.email.trim().length > 0;

  return Object.freeze({
    sanitizedUsername,
    usernameValue: mapToDisplayValue(sanitizedUsername, fallbackValue),
    emailValue: mapToDisplayValue(user?.email, fallbackValue),
    phoneValue: formatPhoneDisplay(user?.phone, {
      fallbackValue,
      defaultCode: defaultPhoneCode,
    }),
    hasBoundEmail,
  });
};

export const useEmailUnbindCommand = ({ accountSnapshot, emailBinding }) => {
  const {
    unbindEmail: performEmailUnbind,
    isUnbinding: isEmailUnbinding,
    startEditing: beginEmailRebinding,
  } = emailBinding ?? {};

  const handleEmailUnbind = useCallback(async () => {
    if (!accountSnapshot.hasBoundEmail) {
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
  }, [accountSnapshot.hasBoundEmail, beginEmailRebinding, performEmailUnbind]);

  return { handleEmailUnbind, isEmailUnbinding: Boolean(isEmailUnbinding) };
};
