import type { QueryResult } from "pg";

export function assertColumns<R extends Record<string, unknown>>(
  qryName: string,
  result: QueryResult<R>,
): void {
  /* dev-time safety: Proxy every row so a typo surfaces immediately */
  if (process.env.NODE_ENV !== "production") {
    const harmless = new Set([
      "toJSON",
      "toString",
      "valueOf",
      "then",
      "catch",
      "finally",
      Symbol.toStringTag as unknown as string,
    ]);
    result.rows = result.rows.map(
      (row) =>
        new Proxy(row, {
          get(target, prop: string | symbol, receiver) {
            if (typeof prop === "symbol") {
              return Reflect.get(target, prop, receiver);
            }
            // true for own column properties
            if (Object.prototype.hasOwnProperty.call(target, prop)) {
              return Reflect.get(target, prop, receiver);
            }
            if (harmless.has(prop)) {
              return Reflect.get(target, prop, receiver);
            }
            throw new Error(
              `Query "${qryName}" did not return column "${prop}"`,
            );
          },
        }),
    ) as unknown as typeof result.rows;
  }
}
