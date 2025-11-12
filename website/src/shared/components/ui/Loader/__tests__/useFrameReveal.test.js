import { jest } from "@jest/globals";
import {
  restoreAnimationEnvironment,
  intervalExpectationCases,
  runIntervalScenario,
} from "./frameRevealTestHarness.js";

describe("useFrameReveal default animation", () => {
  afterEach(() => {
    restoreAnimationEnvironment();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test.each(intervalExpectationCases)(
    "Given interval animation When callbacks fire Then $expectation",
    ({ assertThen }) => {
      const scenario = runIntervalScenario();
      assertThen(scenario);
    },
  );
});
