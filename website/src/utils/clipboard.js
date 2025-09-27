const getNavigatorRef = () =>
  typeof navigator !== "undefined" ? navigator : undefined;

export async function copyTextToClipboard(text, { clipboard } = {}) {
  const source = typeof text === "string" ? text : "";
  if (!source.trim()) {
    return { status: "empty" };
  }

  const targetClipboard = clipboard || getNavigatorRef()?.clipboard;
  const writeText = targetClipboard?.writeText?.bind(targetClipboard);
  if (!writeText) {
    return { status: "unavailable" };
  }

  try {
    await writeText(source);
    return { status: "copied" };
  } catch (error) {
    return { status: "error", error };
  }
}

export const __private__ = { getNavigatorRef };
