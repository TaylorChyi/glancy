import glancyWebLight from "./brand/glancy-web-light.svg";
import glancyWebDark from "./brand/glancy-web-dark.svg";
import userLight from "./icons/user-light.svg";
import userDark from "./icons/user-dark.svg";
import emailLight from "./icons/email-light.svg";
import emailDark from "./icons/email-dark.svg";
import phoneLight from "./icons/phone-light.svg";
import phoneDark from "./icons/phone-dark.svg";
import wechatLight from "./logos/wechat-light.svg";
import wechatDark from "./logos/wechat-dark.svg";
import appleLight from "./logos/apple-light.svg";
import appleDark from "./logos/apple-dark.svg";
import googleLight from "./logos/google-light.svg";
import googleDark from "./logos/google-dark.svg";

/**
 * Icon registry generated via `import.meta.glob`.
 * Aggregates all SVG assets within the assets directory.
 */

const glob =
  typeof import.meta !== "undefined" && typeof import.meta.glob === "function"
    ? import.meta.glob
    : () => ({});

const modules = glob("./**/*.svg", {
  eager: true,
  import: "default",
});

const buildDynamicRegistry = () => {
  const collected = {};

  for (const [path, mod] of Object.entries(modules)) {
    const filename = path.split("/").pop()?.replace(".svg", "");

    if (!filename) {
      continue;
    }

    if (filename.endsWith("-light")) {
      const name = filename.replace("-light", "");
      collected[name] = { ...(collected[name] || {}), light: mod };
    } else if (filename.endsWith("-dark")) {
      const name = filename.replace("-dark", "");
      collected[name] = { ...(collected[name] || {}), dark: mod };
    } else {
      collected[filename] = { ...(collected[filename] || {}), single: mod };
    }
  }

  return collected;
};

const manualRegistry = {
  "glancy-web": { light: glancyWebLight, dark: glancyWebDark },
  user: { light: userLight, dark: userDark },
  email: { light: emailLight, dark: emailDark },
  phone: { light: phoneLight, dark: phoneDark },
  wechat: { light: wechatLight, dark: wechatDark },
  apple: { light: appleLight, dark: appleDark },
  google: { light: googleLight, dark: googleDark },
};

const mergeVariantMaps = (...sources) => {
  const merged = {};

  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const [name, variants] of Object.entries(source)) {
      merged[name] = { ...(merged[name] || {}), ...variants };
    }
  }

  return merged;
};

const dynamicRegistry = buildDynamicRegistry();
const hasDynamicEntries = Object.keys(dynamicRegistry).length > 0;

const combinedRegistry = mergeVariantMaps(
  manualRegistry,
  hasDynamicEntries ? dynamicRegistry : null,
);

const frozenIcons = Object.fromEntries(
  Object.entries(combinedRegistry).map(([name, variants]) => [
    name,
    Object.freeze({ ...variants }),
  ]),
);

export default Object.freeze(frozenIcons);
