/* Question 1 */
interface Some<T>{
    tag: "Some";
    value: T;
}
interface None{
    tag: "None";
}
export type Optional<T> = Some<T> | None;

export const makeSome:<T>(val : T) => Some<T> = (val) => ({tag: "Some", value: val});
export const makeNone: () => None = () => ({tag: "None"});

export const isSome = <T>(x: Optional<T>): x is Some<T> => x.tag === "Some";//check if this type checking is good enough
export const isNone = <T>(x: Optional<T>): x is None => x.tag === "None";

/* Question 2 */
export const bind: <T, U>(optional: Optional<T>, f: (x: T) => Optional<U>) => Optional<U> = <T, U>(optional: Optional<T>, f: (x: T) => Optional<U>): Optional<U> => {
   return isNone(optional)? optional: f(optional.value);
};