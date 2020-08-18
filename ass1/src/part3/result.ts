import { reduce } from "ramda";

/* Question 3 */
interface OK<T>{
    tag : "Ok";
    value : T;
}
interface Failure{
    tag: "Failure";
    message: string;
}
export type Result<T> = OK<T> | Failure;

export const makeOk: <T>(val : T) => OK<T> = (val) => ({tag: "Ok", value: val});;
export const makeFailure: (message: string) => Failure = (mes) => ({tag: "Failure", message: mes});;

export const isOk =  <T>(r : Result<T>): r is OK<T> => r.tag === "Ok" ;
export const isFailure =  <T>(r : Result<T>): r is Failure => r.tag === "Failure" ;;

/* Question 4 */
export const bind: <T, U>(res: Result<T>, f: (x: T) => Result<U>)=> Result<U> = <T, U>(res: Result<T>, f: (x: T) => Result<U>): Result<U> => {
    return isFailure(res)? res: f(res.value);
};

/* Question 5 */
interface User {
    name: string;
    email: string;
    handle: string;
}

const validateName = (user: User): Result<User> =>
    user.name.length === 0 ? makeFailure("Name cannot be empty") :
    user.name === "Bananas" ? makeFailure("Bananas is not a name") :
    makeOk(user);

const validateEmail = (user: User): Result<User> =>
    user.email.length === 0 ? makeFailure("Email cannot be empty") :
    user.email.endsWith("bananas.com") ? makeFailure("Domain bananas.com is not allowed") :
    makeOk(user);

const validateHandle = (user: User): Result<User> =>
    user.handle.length === 0 ? makeFailure("Handle cannot be empty") :
    user.handle.startsWith("@") ? makeFailure("This isn't Twitter") :
    makeOk(user);

export const naiveValidateUser= (user: User): Result<User> => {
    return isFailure(validateName(user))? validateName(user) : isFailure(validateEmail(user))? validateEmail(user): validateHandle(user)   ;
}
export const monadicValidateUser = (user: User): Result<User> => {
    return reduce(bind, validateName(user), [validateEmail,validateHandle]);
}