const isBrowser = typeof document !== "undefined";

function buildCookieString(name, value, options = {}) {
  const segments = [`${name}=${value}`];

  if (options.maxAge != null) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  segments.push(`Path=${options.path ?? "/"}`);

  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    segments.push("Secure");
  }

  return segments.join("; ");
}

export function setCookie(name, value, options = {}) {
  if (!isBrowser) return false;
  document.cookie = buildCookieString(name, value, options);
  return true;
}

export function deleteCookie(name) {
  if (!isBrowser) return false;
  document.cookie = buildCookieString(name, "", {
    expires: new Date(0),
    path: "/",
  });
  return true;
}

export function hasCookie(name) {
  if (!isBrowser) return false;
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${name}=`));
}

export function getCookie(name) {
  if (!isBrowser) return null;
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}
