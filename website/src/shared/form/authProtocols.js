export const AUTH_METHODS = Object.freeze({
  username: "username",
  email: "email",
});

export const AUTH_CODE_PURPOSES = Object.freeze({
  LOGIN: "LOGIN",
  REGISTER: "REGISTER",
});

const DEFAULT_ERROR_MESSAGE = "Unsupported authentication method";

export const normalizeAccountValue = (raw) => {
  if (typeof raw !== "string") {
    return raw ?? "";
  }
  return raw.trim();
};

const normalizeSecretValue = (raw) => {
  if (typeof raw !== "string") {
    return raw ?? "";
  }
  return raw.trim();
};

const ensureMethodSupported = (method, supported, message) => {
  if (supported.includes(method)) {
    return;
  }
  throw new Error(message ?? DEFAULT_ERROR_MESSAGE);
};

export const buildLoginRequest = ({
  method,
  account,
  password,
  paths,
  unsupportedMessage,
}) => {
  ensureMethodSupported(
    method,
    [AUTH_METHODS.username, AUTH_METHODS.email],
    unsupportedMessage,
  );
  if (method === AUTH_METHODS.username) {
    return {
      path: paths.login,
      body: {
        account,
        password,
        method,
      },
    };
  }
  return {
    path: paths.loginWithEmail,
    body: {
      email: account,
      code: normalizeSecretValue(password),
    },
  };
};

export const buildRegisterRequest = ({
  method,
  account,
  password,
  paths,
}) => ({
  path: paths.register,
  body: {
    [method]: account,
    code: normalizeSecretValue(password),
  },
});

export const buildCodeRequest = ({
  method,
  account,
  purpose,
  paths,
  unsupportedMessage,
}) => {
  ensureMethodSupported(
    method,
    [AUTH_METHODS.email],
    unsupportedMessage,
  );
  return {
    path: paths.emailVerificationCode,
    body: { email: account, purpose },
  };
};

export const createAuthSubmissionProtocol = ({ api, paths }) => {
  const login = async ({
    method,
    account,
    password,
    unsupportedMessage,
  }) => {
    const sanitizedAccount = normalizeAccountValue(account);
    const request = buildLoginRequest({
      method,
      account: sanitizedAccount,
      password,
      paths,
      unsupportedMessage,
    });
    return api.jsonRequest(request.path, {
      method: "POST",
      body: request.body,
    });
  };

  const register = async ({ method, account, password }) => {
    const sanitizedAccount = normalizeAccountValue(account);
    const request = buildRegisterRequest({
      method,
      account: sanitizedAccount,
      password,
      paths,
    });
    await api.jsonRequest(request.path, {
      method: "POST",
      body: request.body,
    });
  };

  const requestCode = async ({
    method,
    account,
    purpose,
    unsupportedMessage,
  }) => {
    const sanitizedAccount = normalizeAccountValue(account);
    const request = buildCodeRequest({
      method,
      account: sanitizedAccount,
      purpose,
      paths,
      unsupportedMessage,
    });
    await api.jsonRequest(request.path, {
      method: "POST",
      body: request.body,
    });
  };

  return { login, register, requestCode };
};
