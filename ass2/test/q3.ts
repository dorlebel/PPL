import {ForExp, AppExp, Exp, Program, isForExp, isProgram,NumExp,makeVarDecl , isDefineExp, makeDefineExp, VarDecl, makeProcExp as makeProcExp21,makeAppExp as makeAppExp21, makeProgram, isExp, isAtomicExp, isCExp as isCExp21,makeForExp,makeIfExp, isIfExp, isProcExp, isAppExp, ProcExp} from "./L21-ast";
import { Result, makeOk, mapResult, bind, makeFailure, safe4, safe3, safe2 } from "../imp/result";
import { makeAppExp, makeProcExp, CExp, makeNumExp, isCExp, parseL2Program,  isNumExp} from "../imp/L2-ast";
import {range, map, filter} from "ramda";
import { allT } from "../imp/list";


/*
Purpose: convert ForExp in L21 to AppExp by syntactic transformation
Signature: for2app (exp: ForExp)
Type: [ForExp]->[AppExp]
*/
export const for2app = (exp: ForExp): AppExp =>
    makeAppExp( makeProcExp([], makeForLambdas(exp)),[]);
    

const makeForLambdas = (exp: ForExp): CExp[]=>
map(
    (x:number) => makeAppExp(makeProcExp([exp.var],isCExp(exp.body)? [exp.body] :[] ),[makeNumExp(x)]) 
    ,range(exp.start.val, exp.end.val+1)
    );

/*
Purpose: gets an L21 AST and returnsan equivalent L2 AST
Signature: L21ToL2 (exp: Exp | Program)
Type: [AST]->[AST]
*/
export const L21ToL2 = (exp: Exp | Program): Result<Exp| Program> =>
    isProgram(exp) ? 
        bind(mapResult(L21ToL2, exp.exps),
         (exps: (Exp|Program)[]) => (allT(isExp,exps) ? makeOk(makeProgram(exps)) : makeFailure("invalid expression") ))
    : isDefineExp(exp) ?
        // bind(safe2( (vars: VarDecl, val:(Exp|Program)) =>  (isCExp(val))? makeOk(makeDefineExp(vars,val)) : makeFailure("invalid expression"))
        // (makeOk(exp.var),L21ToL2(exp.val)), (def)=> isDefineExp(def) ? makeOk(def) : makeFailure("invalid expression"))
        bind(L21ToL2(exp.val) , (c: (Exp|Program)) => (isCExp(c))? makeOk(makeDefineExp(exp.var,c)) : makeFailure("invalid expression"))
    : isAtomicExp(exp)?
        makeOk(exp)
    : isForExp(exp)?
            bind(safe4( (vars: VarDecl, start: NumExp, end: NumExp, body:(Exp|Program)) => (isCExp21(body)? makeOk(for2app(makeForExp(vars,start,end,body))): makeFailure("invalid expression"))) 
            (makeOk(exp.var),makeOk(exp.start),makeOk(exp.end), L21ToL2(exp.body)), (app)=> isAppExp(app) ? makeOk(app) : makeFailure("invalid expression"))
    : isIfExp(exp)?
            bind(safe3((test: (Exp|Program) ,then: (Exp|Program), alt: (Exp|Program)) => isCExp21(test)&& isCExp21(then) && isCExp21(alt) ? makeOk(makeIfExp(test,then,alt)) : makeFailure("invalid expression"))
            (L21ToL2(exp.test),L21ToL2(exp.then),L21ToL2(exp.alt)), (ife)=> isIfExp(ife) ? makeOk(ife) : makeFailure("invalid expression") )
    : isProcExp(exp)?
        bind(safe2( ( args: VarDecl[], body: (Exp | Program)[]) =>(allT(isCExp21,body)? makeOk(makeProcExp21(args, body)) : makeFailure("invalid expression")))
            (makeOk(exp.args),mapResult(L21ToL2,exp.body)), (pro)=> isProcExp(pro) ? makeOk(pro) : makeFailure("invalid expression") )
    : isAppExp(exp)?
        bind(safe2( ( rator:(Exp | Program) , rands: (Exp | Program)[] )=>( isCExp21(rator) && allT(isCExp21,rands) ? makeOk(makeAppExp21(rator, rands)) : makeFailure("invalid expression")))
            (L21ToL2(exp.rator),mapResult(L21ToL2,exp.rands)), (ap)=> isAppExp(ap) ? makeOk(ap) : makeFailure("invalid expression") )
    : makeFailure("invalid expression");

