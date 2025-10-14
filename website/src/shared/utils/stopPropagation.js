export function withStopPropagation(handler = () => {}) {
  return function (event, ...args) {
    event.stopPropagation();
    return handler(event, ...args);
  };
}
