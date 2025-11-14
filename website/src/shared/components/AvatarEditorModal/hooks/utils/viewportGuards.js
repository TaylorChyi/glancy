export const isFiniteNumber = (value) => Number.isFinite(value);

export const isPositiveNumber = (value) => isFiniteNumber(value) && value > 0;

export const ensureFiniteNumber = (value, fallback = 0) =>
  isFiniteNumber(value) ? value : fallback;

export const ensurePositiveNumber = (value, fallback) =>
  (isPositiveNumber(value) ? value : fallback);

export const hasPositiveDimensions = ({ width, height }) =>
  isPositiveNumber(width) && isPositiveNumber(height);

export const getHalf = (value) => ensureFiniteNumber(value) / 2;
