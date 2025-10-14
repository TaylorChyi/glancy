/**
 * 背景：
 *  - 样式检查配置散落在根目录，难以与其它质量工具协同管理。
 * 目的：
 *  - 将 Stylelint 规则集中到 quality 层，便于统一维护与复用。
 * 关键决策与取舍：
 *  - 保持标准配置并忽略 Tailwind/Global 伪类，兼顾现有代码；
 *  - 维持 CommonJS 导出，以兼容 Stylelint 对配置模块的默认解析。
 * 影响范围：
 *  - 所有样式文件的 lint 规则。
 * 演进与TODO：
 *  - 后续可针对模块化 CSS 与 Tailwind 分别制定更细粒度规则。
 */
module.exports = {
  extends: ["stylelint-config-standard"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind", "layer"],
      },
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global"],
      },
    ],
  },
};
