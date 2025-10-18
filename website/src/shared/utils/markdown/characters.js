/**
 * 背景：
 *  - 标点与字符判断在多个策略中复用，需要集中维护避免重复实现。
 * 目的：
 *  - 暴露字符级工具函数，为空格补写、示例分词等提供支撑。
 */
import { CJK_TRANSLATION_PUNCTUATION_PATTERN, HAN_SCRIPT_PATTERN } from "./constants/index.js";

export function isAsciiDigit(char) {
  return char >= "0" && char <= "9";
}

export function isAsciiUppercase(char) {
  return char >= "A" && char <= "Z";
}

export function isAsciiLetter(char) {
  return (char >= "A" && char <= "Z") || (char >= "a" && char <= "z");
}

export function isHanChar(char) {
  return HAN_SCRIPT_PATTERN.test(char);
}

export function isCjkPunctuation(char) {
  return /[\u3000-\u303F\uFF00-\uFF65。，；：！？、（）「」『』《》〈〉【】]/u.test(char);
}

export function isSpacingCandidate(char) {
  if (!char) {
    return false;
  }
  if (isAsciiLetter(char) || isAsciiDigit(char)) {
    return true;
  }
  return isHanChar(char);
}

export function isLikelyStandaloneTranslation(candidate) {
  if (!candidate) {
    return false;
  }
  if (HAN_SCRIPT_PATTERN.test(candidate)) {
    return true;
  }
  return CJK_TRANSLATION_PUNCTUATION_PATTERN.test(candidate);
}
