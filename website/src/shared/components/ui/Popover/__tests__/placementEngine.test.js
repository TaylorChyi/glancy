import {
  alignPosition,
  clampToViewport,
  computePopoverPosition,
  computePreferredPlacements,
  resolvePlacement,
} from "../placementEngine";

const BASE_ANCHOR_RECT = {
  top: 100,
  left: 100,
  right: 160,
  bottom: 140,
  width: 60,
  height: 40,
};

const BASE_POP_RECT = {
  width: 80,
  height: 40,
};

const DEFAULT_VIEWPORT = { width: 400, height: 400 };

function createRect(overrides = {}) {
  return { ...BASE_ANCHOR_RECT, ...overrides };
}

function createResolution(placement, axis, position) {
  return { placement, axis, position };
}

describe("computePreferredPlacements", () => {
  test("removes duplicates while preserving order", () => {
    const result = computePreferredPlacements("bottom", [
      "bottom",
      "top",
      "left",
    ]);

    expect(result).toEqual(["bottom", "top", "left"]);
  });
});

describe("resolvePlacement", () => {
  test("chooses the first candidate that fits", () => {
    const placements = ["bottom", "top"];
    const anchorRect = createRect({ top: 360, bottom: 400 });
    const popRect = { width: 80, height: 60 };

    const resolution = resolvePlacement({
      anchorRect,
      popRect,
      placements,
      offset: 8,
      viewport: { width: 400, height: 380 },
    });

    expect(resolution.placement).toBe("top");
    expect(resolution.position).toEqual({ top: 292, left: 100 });
  });
});

describe("alignPosition", () => {
  test("centers horizontal placement when requested", () => {
    const resolution = createResolution("right", "horizontal", {
      top: 100,
      left: 160,
    });
    const popRect = { width: 80, height: 20 };

    const aligned = alignPosition({
      resolution,
      align: "center",
      anchorRect: BASE_ANCHOR_RECT,
      popRect,
    });

    expect(aligned.top).toBe(110);
    expect(aligned.left).toBe(160);
  });
});

describe("clampToViewport", () => {
  test("bounds overflowing coordinates", () => {
    const result = clampToViewport({
      position: { top: -50, left: -120 },
      popRect: BASE_POP_RECT,
      viewport: DEFAULT_VIEWPORT,
      margin: 8,
      axis: "horizontal",
    });

    expect(result.top).toBe(8);
    expect(result.left).toBe(8);
  });
});

describe("computePopoverPosition", () => {
  test("uses primary placement when it fits", () => {
    const { position, placement } = computePopoverPosition({
      anchorRect: createRect(),
      popRect: BASE_POP_RECT,
      placement: "bottom",
      fallbackPlacements: ["top"],
      align: "start",
      offset: 8,
      viewport: DEFAULT_VIEWPORT,
    });

    expect(placement).toBe("bottom");
    expect(position).toEqual({ top: 148, left: 100 });
  });

  test("falls back when space is insufficient", () => {
    const { position, placement } = computePopoverPosition({
      anchorRect: createRect({ top: 360, bottom: 400 }),
      popRect: { width: 80, height: 60 },
      placement: "bottom",
      fallbackPlacements: ["top"],
      align: "start",
      offset: 8,
      viewport: { width: 400, height: 380 },
    });

    expect(placement).toBe("top");
    expect(position).toEqual({ top: 292, left: 100 });
  });
});
