// ========================================================
// L4 normal eval
import { Sexp } from "s-expression";
import { map } from "ramda";
import { CExp, Exp, ProcExp, IfExp, Program, parseL4Exp, LetExp, Binding, isLetExp, PrimOp, VarDecl } from "./L4-ast";
import { isAppExp, isBoolExp, isCExp, isDefineExp, isIfExp, isLitExp, isNumExp,
         isPrimOp, isProcExp, isStrExp, isVarRef } from "./L4-ast";
import { applyEnv, makeEmptyEnv, Env, makeExtEnv } from './L4-env-normal';
//import { isTrueValue } from "./L4-eval";
import { applyPrimitive } from "./evalPrimitive";
import { isClosure, makeClosure, Value, Closure } from "./L4-value";
import { first, rest, isEmpty } from '../shared/list';
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);
    
// Evaluate a sequence of expressions (in a program)
export const evalExps = (exps: Exp[], env: Env): Result<Value> =>
    isEmpty(exps) ? makeFailure("Empty array") :
    isDefineExp(first(exps)) ? evalDefineExps(first(exps), rest(exps), env) :
    evalCExps(first(exps), rest(exps), env);

export const evalNormalProgram = (program: Program): Result<Value> =>
    evalExps(program.exps, makeEmptyEnv());

export const evalNormalParse = (s: string): Result<Value> =>
    bind(p(s),
         (parsed: Sexp) => bind(parseL4Exp(parsed),
         (exp: Exp) => evalExps([exp], makeEmptyEnv())));
         
export const evalDefineExps = (def: Exp, exps: Exp[], env: Env): Result<Value> =>
    isDefineExp(def) ? evalExps(exps, makeExtEnv([def.var.var], [def.val], env)) :
    makeFailure("Unexpected " + def);

const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isCExp(first) && isEmpty(rest) ? normalEval(first, env) :
    isCExp(first) ? bind(normalEval(first, env), _ => evalExps(rest, env)) :
    makeFailure("Never");

const normalEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? bind(applyEnv(env, exp.var),(c: CExp) => normalEval(c, env)) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    //isLetrecExp(exp) ? evalLetrec(exp, env) :
    isAppExp(exp) ? bind(normalEval(exp.rator, env),
        (prc: Value) => isPrimOp(prc)? applyPrimOp(prc, exp.rands, env)
                    : isClosure(prc)? applyClosure(prc, exp.rands, env) 
                    : makeFailure("invalid app expression"))
    : makeFailure(`Bad L4 AST ${exp}`);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(normalEval(exp.test, env),
        (test: Value) => isTrueValue(test) ? normalEval(exp.then, env) : normalEval(exp.alt, env));
        
const evalProc = (exp: ProcExp, env: Env): Result<Value> =>
    makeOk(makeClosure(exp.args, exp.body, env));

const evalLet = (exp: LetExp, env: Env): Result<Value> =>{
    const vals = map((b: Binding) => b.val, exp.bindings);
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return evalExps(exp.body, makeExtEnv(vars, vals, env));
}
const applyPrimOp =(prc: PrimOp, rands: CExp[], env: Env): Result<Value> =>
    bind( mapResult((e: CExp) => normalEval(e ,env), rands),(args)=>(applyPrimitive(prc, args)));

const applyClosure = (prc: Closure, rands: CExp[], env: Env) : Result<Value> =>{
    const vars = map((p: VarDecl) => p.var, prc.params);
    return evalExps( prc.body, makeExtEnv(vars, rands, env));
}

