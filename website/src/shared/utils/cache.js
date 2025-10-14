/**
 * 创建一个带有内存缓存的异步函数包装器。
 * @template T
 * @template R
 * @param {(args: T) => Promise<R>} fn 实际执行的异步函数
 * @param {(args: T) => string} keyResolver 根据入参生成缓存键的方法
 * @returns {(args: T) => Promise<R>} 带缓存的函数
 */
export function createCachedFetcher(fn, keyResolver) {
  const cache = new Map();
  return async (args) => {
    const key = keyResolver(args);
    if (cache.has(key)) return cache.get(key);
    const result = await fn(args);
    cache.set(key, result);
    return result;
  };
}
