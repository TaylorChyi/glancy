const isFunction = (candidate) => typeof candidate === "function";

const normalizeSteps = (steps) =>
  Array.isArray(steps) ? steps.filter(isFunction) : [];

export const pipeline = (steps = []) => {
  const normalized = normalizeSteps(steps);
  return (input) => normalized.reduce((state, step) => step(state), input);
};

export const runPipeline = (input, steps = []) => pipeline(steps)(input);
