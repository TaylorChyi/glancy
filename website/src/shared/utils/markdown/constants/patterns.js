export const NEWLINE_NORMALIZER = /\r\n?|\u2028|\u2029/g;
export const HEADING_WITHOUT_SPACE = /^(#{1,6})([^\s#])/gm;
export const LIST_MARKER_WITHOUT_GAP = /^(\d+[.)])([^\s])/gm;
export const HEADING_WITHOUT_PADDING = /([^\n])\n(#{1,6}\s)/g;
export const HEADING_STUCK_TO_PREVIOUS = /([^\n\s])((?:#{1,6})(?=\S))/g;
export const BROKEN_HEADING_LINE_PATTERN =
  /^(#{1,6})(?:[ \t]*)\n([ \t]*)(\S[^\n]*)$/gm;
export const SECTION_CONTENT_WORD_PATTERN = /[\p{L}\p{N}]/u;
export const HEADING_ATTACHED_LIST_PATTERN =
  /^(#{1,6}\s*)([^\n]*?)(-)(?!-)([^\n]+)$/gm;
export const HEADING_INLINE_LABEL_PATTERN =
  /^(#{1,6}[^\n]*?)(\*\*([^*]+)\*\*:[^\n]*)/gm;
export const INLINE_LABEL_PATTERN =
  /([^\n])((?:[ \t]*\t[ \t]*)|(?:[ \t]{2,}))(\*\*([^*]+)\*\*:[^\n]*)/g;
export const INLINE_LABEL_NO_BOUNDARY_PATTERN =
  /([^\s>\n])(\*\*([^*]+)\*\*:[^\n]*)/g;
export const INLINE_LABEL_BOUNDARY_PREFIX_RE =
  /[A-Za-z0-9\u4e00-\u9fff)\]}”’'".!?。，；：、]/u;
export const COLLAPSED_LABEL_CHAIN_PATTERN =
  /(:)([A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*)(?=:[^\s])/gmu;
export const ADJACENT_LABEL_PATTERN =
  /(?<=\S)[A-Za-z\p{L}\u4e00-\u9fff][\w\u4e00-\u9fff-]*:/gmu;
export const BARE_INLINE_LABEL_PATTERN =
  /(^|[^\S\n>]|[)\]}”’'".!?。，；：、])([A-Za-z\p{L}\u4e00-\u9fff][\w.\u4e00-\u9fff-]*)(?=:(?!\/\/))/gmu;
export const COLON_WITHOUT_SPACE_PATTERN = /:([^\s])/g;
export const DECORATED_LABEL_VALUE_PATTERN = /(\*\*([^*]+)\*\*):\s*([^\n]*)/g;
export const DANGLING_LABEL_SEPARATOR_PATTERN =
  /([^\n]*?)(?:\s*-\s*)\n([ \t]*)(\*\*([^*]+)\*\*:[^\n]*)/g;
export const DANGLING_LABEL_INLINE_CHAIN_PATTERN =
  /(?<=\S)([ \t]*-)[ \t]*(\*\*([^*]+)\*\*:[^\n]*)/g;
export const DANGLING_LABEL_SPACE_CHAIN_PATTERN =
  /(?<=\S)([ \t]{2,})(\*\*([^*]+)\*\*:[^\n]*)/g;
export const INLINE_LABEL_SINGLE_SPACE_PATTERN =
  /(\S)([ \t])(?=\*\*([^*]+)\*\*:[^\n]*)/g;
export const INLINE_LABEL_HYPHEN_GAP_PATTERN =
  /(?<=\S)([ \t]*-[ \t]*)(?=\*\*([^*]+)\*\*:[^\n]*)/gu;
export const INLINE_LABEL_CAMEL_CASE = /([a-z])(\p{Lu})/gu;
export const INLINE_LABEL_DELIMITER = /[^a-z\u4e00-\u9fff]+/giu;
export const INLINE_TRANSLATION_LABEL_PATTERN =
  /(?:^|(?<=\s)|(?<=[\p{P}\p{S}]))(\*\*([^*]+)\*\*|[\p{L}\p{N}]{1,32})(?:\s*)([:：])/gu;
export const TRANSLATION_LABEL_BOUNDARY_PATTERN = /[\p{L}\p{N}*]/u;
export const HAN_SCRIPT_PATTERN = /\p{Script=Han}/u;
export const CJK_TRANSLATION_PUNCTUATION_PATTERN = /[，。、“”‘’！？；：]/u;
