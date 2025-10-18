/**
 * 背景：
 *  - Popover 与选项列表原本内嵌在主组件中，导致 JSX 过长且难以拓展。
 * 目的：
 *  - 封装弹层渲染，集中管理 Popover 策略与列表渲染组合，便于后续替换弹层实现。
 * 关键决策与取舍：
 *  - 继续使用 Popover 组件承载定位逻辑，内部渲染 OptionList；
 *  - 通过 props 暴露最小必要的信息（open/anchorRef/handlers），保持单向数据流。
 * 影响范围：
 *  - SelectMenu 的弹层渲染与选项点击行为。
 * 演进与TODO：
 *  - TODO: 若未来接入虚拟滚动，可在此组件中替换 OptionList 为策略式实现。
 */
import PropTypes from "prop-types";

import Popover from "@shared/components/ui/Popover/Popover.jsx";

import OptionList from "./OptionList.jsx";
import { OptionShape } from "../optionNormalizer.js";

export default function MenuSurface({
  open,
  anchorRef,
  onClose,
  menuRef,
  options,
  activeValue,
  onSelect,
}) {
  return (
    <Popover
      isOpen={open}
      anchorRef={anchorRef}
      onClose={onClose}
      placement="top"
      align="start"
      fallbackPlacements={["bottom"]}
      offset={12}
    >
      <OptionList
        options={options}
        activeValue={activeValue}
        menuRef={menuRef}
        open={open}
        onSelect={onSelect}
      />
    </Popover>
  );
}

MenuSurface.propTypes = {
  open: PropTypes.bool.isRequired,
  anchorRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onClose: PropTypes.func.isRequired,
  menuRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  options: PropTypes.arrayOf(OptionShape).isRequired,
  activeValue: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};
