export type Box<T extends string | number> = { value: T };
export type Unbox<T extends Box<any>> = T["value"];
export const literal = <T extends string | number>(value: T): Box<T> => ({
  value,
});
