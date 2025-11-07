export default function joinClassNames(...tokens) {
  return tokens.filter(Boolean).join(" ");
}
