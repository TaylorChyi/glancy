export const buildHistoryHandlerParams = (keys, source) =>
  keys.reduce((selected, key) => {
    selected[key] = source[key];
    return selected;
  }, {});

export default buildHistoryHandlerParams;
