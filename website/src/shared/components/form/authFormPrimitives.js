const USERNAME_METHOD = "username";

const resolveInitialMethod = (methods, preferredMethod = null) => {
  const availableMethods = Array.isArray(methods) ? methods : [];

  if (availableMethods.length === 0) {
    return preferredMethod ?? null;
  }

  if (availableMethods.includes(USERNAME_METHOD)) {
    return USERNAME_METHOD;
  }

  if (preferredMethod && availableMethods.includes(preferredMethod)) {
    return preferredMethod;
  }

  return availableMethods[0] ?? preferredMethod ?? null;
};

const sanitizeAccount = (value) =>
  typeof value === "string" ? value.trim() : value;

export { resolveInitialMethod, sanitizeAccount };
