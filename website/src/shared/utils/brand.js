export const BRAND_TEXT = {
  zh: "格律词典",
  en: "Glancy",
};

/**
 * 背景：
 *  - UI 层多处使用历史常量 `glancy-web`，但图标注册表仅暴露 `brand-glancy-website` 键，
 *    导致登录/注册与布局入口均出现 SVG 缺失。
 * 目的：
 *  - 提供集中品牌资产常量，保持调用方与资源命名对齐，避免重复硬编码。
 * 演进与TODO：
 *  - 若后续扩展 App/Website 双标识，可在此扩展为枚举映射并保留向后兼容层。
 */
export const BRAND_LOGO_ICON = "brand-glancy-website";

export function getBrandText(lang = "en") {
  return BRAND_TEXT[lang] || BRAND_TEXT.en;
}
