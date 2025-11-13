const isFiniteNumber = (value) => Number.isFinite(value);

export const isPositiveFinite = (value) => isFiniteNumber(value) && value > 0;

export const ensurePositiveFinite = (value, fallback = 0) =>
  isPositiveFinite(value) ? value : fallback;

export const ensureFinite = (value, fallback = 0) =>
  isFiniteNumber(value) ? value : fallback;

export const halveIfPositive = (value) =>
  isPositiveFinite(value) ? value / 2 : 0;

export const shouldUpdateDimension = (previous, next) =>
  Math.abs(previous - next) >= 0.5;
