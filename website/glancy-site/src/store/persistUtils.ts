export function pickState<T extends object, K extends keyof T>(keys: K[]) {
  return (state: T) => {
    const result = {} as Pick<T, K>
    for (const key of keys) {
      result[key] = state[key]
    }
    return result
  }
}
