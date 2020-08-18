import { Exp, Program, isProgram, isBoolExp, isNumExp, isVarRef, isPrimOp, isDefineExp, isProcExp, isIfExp, isAppExp, PrimOp } from '../imp/L2-ast';
import { Result, makeOk, makeFailure, mapResult, bind, safe3, safe2 } from "../imp/result";
import { map } from "ramda";

/*
Purpose: transforms a given L2 program to a JavaScript program
Signature: l2ToJS(exp: Exp | Program)
Type: [Exp | Program]->[string | Failure]
*/
export const l2ToJS = (exp: Exp | Program): Result<string> => 
    isProgram(exp) ? bind(mapResult(l2ToJS, exp.exps), (exps: string[]) => (exps.length === 1) ? makeOk(`console.log(${exps[0]});`) : makeOk(exps.slice(0,exps.length-1).join(";\n").concat(`;\nconsole.log(${exps[exps.length-1]});`))) :
    isBoolExp(exp) ? makeOk(exp.val ? "true" : "false") :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isVarRef(exp) ? makeOk(exp.var) :
    isPrimOp(exp) ? PrimOpToLambda(exp) :
    isDefineExp(exp) ? bind(l2ToJS(exp.val), (val: string) => makeOk(`const ${exp.var.var} = ${val}`)) :
    isProcExp(exp) ? bind(mapResult(l2ToJS, exp.body), (body: string[]) => makeOk(`((${map(v => v.var, exp.args).join(",")}) => ${(body.length == 1) ? `${body}` : `{${body.slice(0,body.length-1).join("; ").concat(`; return ${body[body.length-1]};`)}}`})`)) :
    isIfExp(exp) ? safe3((test: string, then: string, alt: string) => makeOk(`(${test} ? ${then} : ${alt})`))
                    (l2ToJS(exp.test), l2ToJS(exp.then), l2ToJS(exp.alt)) :
    isAppExp(exp) ? safe2((rator: string, rands: string[]) => makeOk(`${ApptoString(rator, rands)}`))
                        (isPrimOp(exp.rator)? makeOk(exp.rator.op) :l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
    makeFailure(`Unknown expression: ${exp}`);

const ApptoString = (rator: string, rands: string[]): string =>
    (rator === "or") ? `(${rands.join(` || `)})`
    : (rator === "and") ? `(${rands.join(` && `)})`
    : (rator === "eq?" ||  rator === "=") ? `(${rands.join(` === `)})`
    : (rator === "not") ? `(!${rands[0]})`
    : (rator === "number?") ? `(typeof(${rands[0]}) === 'number')`
    : (rator === "boolean?") ? `(typeof(${rands[0]}) === 'boolean')`
    : (rator === "+" || rator === "-"|| rator === "*"|| rator === "/"|| rator === "<"|| rator === ">")?  `(${rands.join(` ${rator} `)})`
    : `${rator}(${rands.join(",")})`;

const PrimOpToLambda = (exp: PrimOp) : Result<string> =>
(exp.op === "+" || exp.op === "-"|| exp.op === "*"|| exp.op === "/"|| exp.op === "<"|| exp.op === ">") ? makeOk(exp.op) 
    : (exp.op ==="number?") ? makeOk("((a) => typeof(a) === 'number')")
    : (exp.op ==="boolean?") ? makeOk("((a) => typeof(a) === 'boolean')")
    : (exp.op ==="not") ? makeOk("((a) => !a)")
    : (exp.op ==="eq?" ||  exp.op === "=") ? makeOk("===")
    : (exp.op ==="and") ? makeOk("((a,b) => a && b)")
    : (exp.op ==="or") ? makeOk("((a,b) => a || b)")
    : makeFailure("invalid Operator");
