/**
 * Message files hold all three languages side by side. English defines the
 * shape; Kannada and Hindi must match it key for key (a missing string is a
 * type error, not a blank on the page).
 */
type Fn = (...args: never[]) => unknown;

export type Shape<T> = T extends string
  ? string
  : T extends Fn
    ? T
    : T extends readonly (infer U)[]
      ? ReadonlyArray<Shape<U>>
      : { [K in keyof T]: Shape<T[K]> };

export function defineMessages<T>(m: { en: T; kn: Shape<NoInfer<T>>; hi: Shape<NoInfer<T>> }) {
  return m as { en: T; kn: T; hi: T };
}
