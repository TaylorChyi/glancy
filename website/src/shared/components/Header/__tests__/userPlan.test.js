import { describe, expect, test } from "@jest/globals";
import { resolvePlanDetails } from "../userPlan.js";

describe("resolvePlanDetails", () => {
  test("Given_free_user_When_no_plan_set_Then_returns_free_defaults", () => {
    const details = resolvePlanDetails({ username: "guest" });

    expect(details).toEqual({
      username: "guest",
      isPro: false,
      planLabel: "Free",
    });
  });

  test("Given_paid_plan_When_plan_string_provided_Then_sets_label_and_pro_flag", () => {
    const details = resolvePlanDetails({ username: "pro", plan: "Pro" });

    expect(details).toEqual({
      username: "pro",
      isPro: true,
      planLabel: "Pro",
    });
  });

  test("Given_member_flag_When_plan_missing_Then_defaults_to_plus_membership", () => {
    const details = resolvePlanDetails({ username: "member", member: true });

    expect(details).toEqual({
      username: "member",
      isPro: true,
      planLabel: "Plus",
    });
  });
});
