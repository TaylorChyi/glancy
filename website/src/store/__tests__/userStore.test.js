import { act } from "@testing-library/react";
import { useUserStore } from "@/store";

describe("userStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("setUser and clearUser persist to storage", () => {
    const user = { id: "1", token: "t" };
    act(() => useUserStore.getState().setUser(user));
    expect(useUserStore.getState().user).toEqual(user);
    const stored = JSON.parse(localStorage.getItem("user"));
    expect(stored.state.user).toEqual(user);
    act(() => useUserStore.getState().clearUser());
    expect(useUserStore.getState().user).toBeNull();
    const cleared = JSON.parse(localStorage.getItem("user"));
    expect(cleared.state.user).toBeNull();
  });

  test("getMembershipSnapshot derives active tier", () => {
    const futureExpiry = "2999-01-01T00:00:00Z";
    const user = {
      id: "2",
      token: "token",
      membershipTier: "PRO",
      membershipExpiresAt: futureExpiry,
    };

    act(() => useUserStore.getState().setUser(user));
    const snapshot = useUserStore.getState().getMembershipSnapshot();
    expect(snapshot.active).toBe(true);
    expect(snapshot.tier).toBe("PRO");
    expect(snapshot.planId).toBe("PRO");
    expect(snapshot.expiresAt).toBe(futureExpiry);

    act(() =>
      useUserStore.getState().setUser({ id: "3", token: "t2", member: true }),
    );
    const fallbackSnapshot = useUserStore.getState().getMembershipSnapshot();
    expect(fallbackSnapshot.active).toBe(true);
    expect(fallbackSnapshot.tier).toBe("PLUS");
    expect(fallbackSnapshot.planId).toBe("PLUS");
  });
});
