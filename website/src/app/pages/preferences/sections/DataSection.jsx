/**
 * 背景：
 *  - 偏好设置数据分区曾集成控制逻辑与视图细节，导致组件超出结构化 Lint 限值并难以
 *    扩展。此次重构将状态/命令下放至 Hook，并拆分视图组件，恢复可维护性。
 * 目的：
 *  - 以“控制器 Hook + 纯展示组件”的组合模式组织 DataSection，使页面聚焦布局；
 *  - 保留导出/清理命令的可扩展接口，为后续接入后端服务铺垫。
 * 关键决策与取舍：
 *  - 继续沿用 SegmentedControl + LanguageMenu，避免重写成熟交互；
 *  - SettingsSection 的类名组合保持局部工具函数实现，待共享布局形成后再抽象；
 *  - 未引入新依赖，确保改动可在现有打包链路下平滑演进。
 * 影响范围：
 *  - 偏好设置页面的数据治理分区 UI；
 *  - 结构化 Lint 白名单中移除该文件后，质量守卫恢复生效。
 * 演进与TODO：
 *  - TODO: 接入导出/清理 API 后在控制器 Hook 中扩展异步反馈与错误上报。
 */

import PropTypes from "prop-types";
import { createElement } from "react";
import SettingsSection from "@shared/components/settings/SettingsSection";
import styles from "../Preferences.module.css";
import {
  DataActionsField,
  HistoryCaptureField,
  LanguageHistoryField,
  RetentionField,
} from "./DataSectionFields.jsx";
import { useDataSectionController } from "./useDataSectionController.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const buildFieldDefinitions = ({
  ids,
  copy,
  historyToggle,
  retentionControl,
  languageControl,
  actionsControl,
  isActionPending,
}) => [
  {
    key: "history",
    Component: HistoryCaptureField,
    props: { fieldId: ids.toggle, copy: copy.toggle, control: historyToggle },
  },
  {
    key: "retention",
    Component: RetentionField,
    props: {
      fieldId: ids.retention,
      copy: copy.retention,
      control: retentionControl,
      isPending: isActionPending(retentionControl.pendingId),
    },
  },
  {
    key: "language",
    Component: LanguageHistoryField,
    props: {
      fieldId: ids.language,
      copy: languageControl.copy,
      control: languageControl,
      isPending: isActionPending(languageControl.pendingId),
    },
  },
  {
    key: "actions",
    Component: DataActionsField,
    props: {
      copy: actionsControl.copy,
      control: actionsControl,
      isClearingAll: isActionPending(actionsControl.pendingId),
    },
  },
];

function DataSection({ title, message, headingId, descriptionId }) {
  const {
    copy,
    ids,
    description,
    historyToggle,
    retentionControl,
    languageControl,
    actionsControl,
    isActionPending,
  } = useDataSectionController({ message, descriptionId });

  const fieldDefinitions = buildFieldDefinitions({
    ids,
    copy,
    historyToggle,
    retentionControl,
    languageControl,
    actionsControl,
    isActionPending,
  });

  return (
    <SettingsSection
      headingId={headingId}
      title={title}
      description={description.section}
      descriptionId={description.id}
      classes={{
        section: composeClassName(styles.section, styles["section-plain"]),
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
        description: styles["visually-hidden"],
      }}
    >
      <div className={styles.controls}>
        {fieldDefinitions.map(({ key, Component, props }) =>
          createElement(Component, { key, styles, ...props }),
        )}
      </div>
    </SettingsSection>
  );
}

DataSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
};

DataSection.defaultProps = {
  message: "",
  descriptionId: undefined,
};

export default DataSection;
