export function camelizeObject<T>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => camelizeObject(item)) as unknown as T;
  }
  if (input !== null && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      result[camelKey] = camelizeObject(value);
    }
    return result as T;
  }
  return input as T;
}
