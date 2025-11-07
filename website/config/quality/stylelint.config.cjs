module.exports = {
  extends: ["stylelint-config-standard"],
  overrides: [
    {
      files: ["src/styles/**/*.css"],
      rules: {
        "declaration-property-value-allowed-list": [
          {
            "/color/": [
              "/^var\\(--.*\\)$/",
              "/^color-mix[\\s\\S]+$/",
              "transparent",
              "currentColor",
              "inherit",
              "initial",
              "unset",
            ],
            background: [
              "/^var\\(--.*\\)$/",
              "/^color-mix[\\s\\S]+$/",
              "transparent",
              "inherit",
              "initial",
            ],
            "background-color": [
              "/^var\\(--.*\\)$/",
              "/^color-mix[\\s\\S]+$/",
              "transparent",
              "inherit",
            ],
            "font-size": ["/^var\\(--.*\\)$/"],
            "line-height": ["/^var\\(--.*\\)$/", "normal", "inherit"],
            "border-radius": ["/^var\\(--.*\\)$/", "0", "inherit"],
            "box-shadow": ["/^var\\(--.*\\)$/", "none", "inherit"],
            "z-index": ["/^var\\(--.*\\)$/"],
            margin: ["/^var\\(--.*\\)$/", "0", "auto", "inherit"],
            padding: ["/^var\\(--.*\\)$/", "0", "inherit"],
            gap: ["/^var\\(--.*\\)$/", "0", "inherit"],
            "padding-inline": ["/^var\\(--.*\\)$/", "0", "inherit"],
            "padding-block": ["/^var\\(--.*\\)$/", "0", "inherit"],
            "color-scheme": ["light", "dark"],
          },
          {
            message: "请使用设计令牌（var(--…)) 表达关键视觉参数。",
          },
        ],
      },
    },
  ],
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
    "color-hex-length": null,
    "custom-property-empty-line-before": null,
    "value-keyword-case": null,
  },
};
