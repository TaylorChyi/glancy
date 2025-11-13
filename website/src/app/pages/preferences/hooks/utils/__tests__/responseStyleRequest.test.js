import { jest } from "@jest/globals";

const createEmptyProfileDetails = jest.fn(() => ({ job: "" }));
const mapResponseToProfileDetails = jest.fn((response) => ({
  ...response,
  normalized: true,
}));

jest.unstable_mockModule(
  "@app/pages/profile/profileDetailsModel.js",
  () => ({
    createEmptyProfileDetails,
    mapResponseToProfileDetails,
  }),
);

const { RESPONSE_STYLE_ACTIONS } = await import(
  "../../../sections/responseStyleModel.js"
);
const { createResponseStyleRequest } = await import(
  "../responseStyleRequest.js"
);

describe("createResponseStyleRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given missing token When invoked Then hydrates with empty profile", async () => {
    const dispatch = jest.fn();
    const profileDetailsRef = { current: null };
    const request = createResponseStyleRequest({
      dispatch,
      user: {},
      fetchProfile: jest.fn(),
      profileDetailsRef,
    });

    await request();

    expect(createEmptyProfileDetails).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: RESPONSE_STYLE_ACTIONS.hydrate,
      payload: { job: "" },
    });
    expect(profileDetailsRef.current).toEqual({ job: "" });
  });

  test("Given authenticated user When request resolves Then dispatches loading and hydrate", async () => {
    const profileDetails = { job: "Engineer" };
    mapResponseToProfileDetails.mockReturnValue(profileDetails);
    const dispatch = jest.fn();
    const fetchProfile = jest.fn().mockResolvedValue({ job: "Engineer" });
    const profileDetailsRef = { current: null };

    const request = createResponseStyleRequest({
      dispatch,
      user: { token: "token-1" },
      fetchProfile,
      profileDetailsRef,
    });

    await request();

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: RESPONSE_STYLE_ACTIONS.loading,
    });
    expect(fetchProfile).toHaveBeenCalledWith({ token: "token-1" });
    expect(dispatch).toHaveBeenCalledWith({
      type: RESPONSE_STYLE_ACTIONS.hydrate,
      payload: profileDetails,
    });
    expect(profileDetailsRef.current).toEqual(profileDetails);
  });
});
