const createBaseUser = () => ({
  id: "user-1",
  username: "Ada",
  email: "ada@example.com",
  phone: "+1-111",
  plan: "plus",
  token: "token-123",
  locale: "en-US",
  avatar: "/assets/avatar/default.png",
  isPro: true,
});

/**
 * Creates a normalized user object for tests while allowing selective overrides.
 * @param {Partial<ReturnType<typeof createBaseUser>>} overrides
 * @returns {ReturnType<typeof createBaseUser>}
 */
export function makeUser(overrides = {}) {
  return {
    ...createBaseUser(),
    ...overrides,
  };
}

export default makeUser;
