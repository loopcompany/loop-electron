import { languageDirection } from '@services/localizationRegistry';
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 32,
};

const langIsRTL = (lang) => languageDirection(lang) === 'rtl';

// weight: 'bold' | 'light'. Mirrors the RTL font-family switch already used
// in styles/NewStyles.js (Vazir* for LTR, Vazir*FD for RTL).
export const getFontFamily = (weight, lang) => {
  const isRTL = langIsRTL(lang);
  if (weight === "bold") return isRTL ? "VazirBoldFD" : "VazirBold";
  return isRTL ? "VazirLightFD" : "VazirLight";
};

export default fontSize;
