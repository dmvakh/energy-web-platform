/** Рекурсивно переводит строковый литерал из snake_case в camelCase */
type CamelCase<S extends string> = S extends `${infer P}_${infer U}`
  ? `${P}${Capitalize<CamelCase<U>>}`
  : S;

/** Рекурсивно преобразует все ключи объекта из snake_case в camelCase */
export type Camelize<T> = {
  // eslint-disable-next-line
  [K in keyof T as CamelCase<K & string>]: T[K] extends Record<string, any>
    ? Camelize<T[K]>
    : T[K];
};
