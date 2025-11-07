export const BRAND_TEXT = {
  zh: "格律词典",
  en: "Glancy",
};


export const BRAND_LOGO_ICON = "brand-glancy-website";

export function getBrandText(lang = "en") {
  return BRAND_TEXT[lang] || BRAND_TEXT.en;
}
