
import { Parsed,DefineExp, Binding, isIfExp , isAtomicExp, isProgram,isAppExp, isBoolExp, isNumExp, isPrimOp, isStrExp, isVarRef, AtomicExp, isCompoundExp, CompoundExp, isProcExp, Exp, VarDecl, CExp, isLetExp, isLitExp, isSetExp, isDefineExp,isBinding, isCExp,isLetrecExp, parseL4, Program, parseL4Exp } from "./L4-ast"
import { Result, makeOk, makeFailure, bind, isOk } from "../shared/result"
import { cons } from "../shared/list"
import { Graph, makeGraph, makeDir, GraphContent, NodeDecl, Node, makeAtomicGraph, makeNodeDecl, makeCompoundGraph, Edge, makeEdge, makeNodeRef, isCompoundGraph, isAtomicGraph, isNodeDecl, isEdge } from "./mermaid-ast"
import { map, mergeAll, reduce, merge } from "ramda"
import { makeVarGen } from "../L3/substitute"
import { SExpValue, isSymbolSExp, isCompoundSExp, isEmptySExp } from "./L4-value"
import { isNumber, isBoolean, isString } from "../shared/type-predicates"
import { isUndefined } from "util"
import { parse } from "../shared/parser"
import { Sexp } from "s-expression"

const numVarGen = makeVarGen();
const boolVarGen = makeVarGen();
const varDeclVarGen = makeVarGen();
const primOpVarGen = makeVarGen();
const StrVarGen = makeVarGen();
const VarRefVarGen = makeVarGen();
const ProcVarGen = makeVarGen();
const ParamsVarGen = makeVarGen();
const BodyVarGen = makeVarGen();
const AppVarGen = makeVarGen();
const RandsVarGen = makeVarGen();
const IfVarGen = makeVarGen();
const LetVarGen = makeVarGen();
const BindVarGen = makeVarGen();
const LitVarGen = makeVarGen();
const CompoundVarGen = makeVarGen();
const EmptySExpVarGen = makeVarGen();
const LetrecVarGen = makeVarGen();
const setVarGen = makeVarGen();
const DefineVarGen = makeVarGen();
//====================================MERGEALL================
export const mergeAllEdges = (arr: Edge[][]) : Edge[] =>
    reduce( (edge1: Edge[], edge2: Edge[]) => edge1.concat(edge2) , [] , arr)

//===================================================2.2===============================================
export const mapL4toMermaid = (exp: Parsed): Result<Graph> =>  
    bind(parseGraphContent(exp) ,(exps: GraphContent)=> makeOk(makeGraph(makeDir("TD"), exps )));//where is program?

export const parseGraphContent = (exp: Parsed): Result<GraphContent> =>
    isProgram(exp)? 
        (makeOk(makeCompoundGraph(((expsId: string) =>
            mergeAllEdges([
                [makeEdge(makeNodeDecl("Program__1","Program"),makeNodeDecl(expsId,":"),"exps")],
                mergeAllEdges(map((exp1: Exp)=>NewEdges(makeNodeRef(expsId),exp1),exp.exps))
            ]))("Exps__1"))
        )) 
    : isAtomicExp(exp)?
        makeOk(makeAtomicGraph(AtomicExpToMermaid(exp)))
    : isCExp(exp)?
        makeOk(makeCompoundGraph(FirstNode(exp)))
    :isDefineExp(exp) ?
        makeOk(makeCompoundGraph(FirstNode(exp)))
    : makeFailure("never?")


export const AtomicExpToMermaid = (exp: AtomicExp): NodeDecl =>
    isNumExp(exp) ? makeNodeDecl( numVarGen("NumExp"),`NumExp(${exp.val})` ) :
    isBoolExp(exp) ? makeNodeDecl(boolVarGen("BoolExp"),`BoolExp(${(exp.val) ? "#t" : "#f"})` ) :
    isPrimOp(exp) ? makeNodeDecl(primOpVarGen("PrimOp"), `PrimOp(${exp.op})`) :
    isStrExp(exp) ? makeNodeDecl(StrVarGen("StrExp"), `StrExp(${exp.val})`) :
    isVarRef(exp) ? makeNodeDecl(VarRefVarGen("VarRef"), `VarRef(${exp.var})`) :
    makeNodeDecl("never","never");


export const FirstNode = (exp: CompoundExp | DefineExp): Edge[] =>
    isCompoundExp(exp) ?
        isAppExp(exp) ?
            ((appId: string, randsId: string) => mergeAllEdges(
                [
                    NewEdges(makeNodeDecl(appId,"AppExp"), exp.rator,"rator"),
                    [makeEdge(makeNodeRef(appId), makeNodeDecl(randsId, ":"), "rands")],
                    mergeAllEdges(map((e:CExp) => NewEdges(makeNodeRef(randsId), e), exp.rands))
                ]
            ))(AppVarGen("AppExp"),RandsVarGen("Rands"))
        : isProcExp(exp) ?
            ((procId: string, paramsId: string, bodyId: string) => mergeAllEdges(
                [
                    [makeEdge(makeNodeDecl(procId,"ProcExp"), makeNodeDecl(paramsId, ":"), "args")],
                    edgeToVarDeclArr( makeNodeRef(paramsId), exp.args ),
                    [makeEdge(makeNodeRef(procId), makeNodeDecl(bodyId, ":"), "body")],
                    mergeAllEdges(map((e: CExp)=>(NewEdges(makeNodeRef(bodyId), e)), exp.body))
                ]
            ))(ProcVarGen("ProcExp"), ParamsVarGen("Params"), BodyVarGen("Body"))
        : isIfExp(exp)? ((ifId: string) => 
            mergeAllEdges( 
                [
                    NewEdges(makeNodeDecl(ifId, "IfExp"), exp.test, "test" ), 
                    NewEdges(makeNodeRef(ifId), exp.then, "then" ), 
                    NewEdges(makeNodeRef(ifId), exp.alt, "alt" )
                ]
            ))(IfVarGen("IfExp"))
        : isLetExp(exp)? ( (letId: string, bindId: string, bodyId: string) =>  
            mergeAllEdges(
                [
                    [makeEdge(makeNodeDecl(letId, "LetExp"), makeNodeDecl(bindId, ":"), "bindings")],
                    mergeAllEdges(map((e: Binding) => (NewEdges(makeNodeRef(bindId), e)), exp.bindings)),
                    [makeEdge(makeNodeRef(letId), makeNodeDecl(bodyId, ":"), "body")],
                    mergeAllEdges(map((e: CExp) => (NewEdges(makeNodeRef(bodyId), e)), exp.body))
                ]
            ))(LetVarGen("LetExp"),BindVarGen("Binding"),BodyVarGen("Body"))
        : isLitExp(exp)?  ((litId: string) => 
                sExpsValueToEdges(makeNodeDecl(litId, "LitExp"), exp.val, "val"))
                    (LitVarGen("LitExp"))
        : isLetrecExp(exp)?( (letRecId: string, bindId: string, bodyId: string) => 
            mergeAllEdges(
                [
                    [makeEdge(makeNodeDecl(letRecId,"LetrecExp"), makeNodeDecl(bindId, ":"), "bindings")],
                    mergeAllEdges(map((e: Binding) => (NewEdges(makeNodeRef(bindId), e)), exp.bindings)),
                    [makeEdge(makeNodeRef(letRecId), makeNodeDecl(bodyId, ":"), "body")],
                    mergeAllEdges(map((e: CExp) => (NewEdges(makeNodeRef(bodyId), e)), exp.body))
                ])
            )(LetrecVarGen("LetrecExp"),BindVarGen("Binding"),BodyVarGen("Body"))
        
        : isSetExp(exp)? ( (setId: string) => mergeAllEdges(
                [
                   [makeEdge(makeNodeDecl(setId, "SetExp"), makeNodeDecl( VarRefVarGen("VarRef"),`VarRef(${exp.var.var})` ),"var") ],
                   NewEdges(makeNodeRef(setId), exp.val, "val")
                ]
            ))(setVarGen("SetExp"))
    :[]
    : isDefineExp(exp)?
    ((defId: string) =>  mergeAllEdges(
        [
            [makeEdge(makeNodeDecl(defId,"DefineExp"), makeNodeDecl(VarRefVarGen("VarRef"), `VarDecl(${exp.var.var})`),"var") ],
            NewEdges(makeNodeRef(defId), exp.val, "val")
        ]
    ))(DefineVarGen("DefineExp"))
    : []


export const edgeToVarDeclArr = (node: Node, v: VarDecl[], label?: string): Edge[] =>
    map((va: VarDecl) => makeEdge(node,makeNodeDecl(varDeclVarGen("VarDecl"),`VarDecl(${va.var})`),label) , v);


export const sExpsValueToEdges = (prevNode: Node, s: SExpValue, label?: string): Edge[] =>
    isNumber(s)? [makeEdge(prevNode, makeNodeDecl( numVarGen("NumExp"), `NumExp(${s})` ), label)]
    : isBoolean(s)? [makeEdge(prevNode, makeNodeDecl( boolVarGen("BooExp"), `BoolExp(${s})` ), label)]
    : isString(s)? [makeEdge(prevNode, makeNodeDecl( StrVarGen("StrExp"), `StrExp(${s})` ), label)]
    : isSymbolSExp(s)? [makeEdge(prevNode, makeNodeDecl( StrVarGen("Symbol"),`symbol(${s.val})`), label)]
    : isCompoundSExp(s)? ((compoundId: string) => 
        cons( makeEdge(prevNode, makeNodeDecl(compoundId, "CompoundSExp"), label ) , 
            mergeAllEdges([
                sExpsValueToEdges(makeNodeRef(compoundId), s.val1, "val1"),
                sExpsValueToEdges(makeNodeRef(compoundId), s.val2, "val2")
            ])))(CompoundVarGen("CompoundSExp"))
    : isEmptySExp(s)? [makeEdge(prevNode, makeNodeDecl( EmptySExpVarGen("EmptySExp"),"EmptySExp"), label)]
    : isPrimOp(s)? [makeEdge(prevNode, makeNodeDecl( primOpVarGen("PrimOp"),`PrimOp(${s.op})` ), label)]
    : [];
    
export const NewEdges = ( prevNode: Node, exp: Exp|Binding, label?: string): Edge[] =>
        isAtomicExp(exp) ? 
            [makeEdge(prevNode,AtomicExpToMermaid(exp), label)]
        : isCompoundExp(exp) ?
            isAppExp(exp) ? ((appId: string, randsId: string) => 
                cons(makeEdge(prevNode, makeNodeDecl(appId,"AppExp"), label), 
                    NewEdges(makeNodeRef(appId), exp.rator,"rator")
                        .concat(makeEdge(makeNodeRef(appId), makeNodeDecl(randsId, ":"), "rands"))
                            .concat(mergeAllEdges(map((e:CExp) => NewEdges(makeNodeRef(randsId), e), exp.rands)))))
                                (AppVarGen("AppExp"),RandsVarGen("Rands"))
            : isProcExp(exp) ? ((procId: string, paramsId: string, bodyId: string) => 
                cons(makeEdge(prevNode, makeNodeDecl(procId,"ProcExp"),label), 
                    cons(makeEdge(makeNodeRef(procId), makeNodeDecl(paramsId, ":"), "args"), 
                        edgeToVarDeclArr( makeNodeRef(paramsId), exp.args ))
                            .concat(cons(makeEdge(makeNodeRef(procId), makeNodeDecl(bodyId, ":"), "body")
                                ,mergeAllEdges(map((e: CExp)=>(NewEdges(makeNodeRef(bodyId), e)), exp.body))))))
                                    (ProcVarGen("ProcExp"), ParamsVarGen("Params"), BodyVarGen("Body"))
            : isIfExp(exp) ? ((ifId: string) => 
                cons(makeEdge(prevNode,makeNodeDecl(ifId,"IfExp"), label),
                    mergeAllEdges( 
                        [
                            NewEdges(makeNodeRef(ifId), exp.test, "test" ), 
                            NewEdges(makeNodeRef(ifId), exp.then, "then" ), 
                            NewEdges(makeNodeRef(ifId), exp.alt, "alt" )
                        ])))(IfVarGen("IfExp"))
            : isLetExp(exp) ? ( (letId: string, bindId: string, bodyId: string) => 
                cons(makeEdge(prevNode, makeNodeDecl( letId, "LetExp"), label), 
                    mergeAllEdges(
                        [
                            [makeEdge(makeNodeRef(letId), makeNodeDecl(bindId, ":"), "bindings")],
                            mergeAllEdges(map((e: Binding) => (NewEdges(makeNodeRef(bindId), e)), exp.bindings)),
                            [makeEdge(makeNodeRef(letId), makeNodeDecl(bodyId, ":"), "body")],
                            mergeAllEdges(map((e: CExp) => (NewEdges(makeNodeRef(bodyId), e)), exp.body))
                        ]
                )))(LetVarGen("LetExp"),BindVarGen("Binding"),BodyVarGen("Body"))
            : isLitExp(exp)?  ((litId: string) => 
                cons( makeEdge(prevNode, makeNodeDecl(litId,"LitExp"),label), 
                    sExpsValueToEdges(makeNodeRef(litId), exp.val, "val")
                        ))(LitVarGen("LitExp"))
            : isLetrecExp(exp)? ( (letRecId: string, bindId: string, bodyId: string) => 
                    cons(makeEdge(prevNode, makeNodeDecl( letRecId, "LetrecExp"), label), 
                    mergeAllEdges(
                    [
                        [makeEdge(makeNodeRef(letRecId), makeNodeDecl(bindId, ":"), "bindings")],
                        mergeAllEdges(map((e: Binding) => (NewEdges(makeNodeRef(bindId), e)), exp.bindings)),
                        [makeEdge(makeNodeRef(letRecId), makeNodeDecl(bodyId, ":"), "body")],
                        mergeAllEdges(map((e: CExp) => (NewEdges(makeNodeRef(bodyId), e)), exp.body))
                    ])))(LetrecVarGen("LetrecExp"),BindVarGen("Binding"),BodyVarGen("Body"))
                    
            : isSetExp(exp)? ( (setId: string) => mergeAllEdges(
                [
                   [makeEdge(prevNode, makeNodeDecl(setId, "SetExp"), label)],
                   [makeEdge(makeNodeRef(setId), makeNodeDecl( VarRefVarGen("VarRef"),`VarRef(${exp.var.var})`),"var") ],
                   NewEdges(makeNodeRef(setId), exp.val, "val")
                ]))(setVarGen("SetExp"))
            :[]
        : isDefineExp(exp) ? ((defId: string) =>  mergeAllEdges(
            [
                [makeEdge(prevNode,makeNodeDecl(defId,"DefineExp"), label)],
                [makeEdge(makeNodeRef(defId), makeNodeDecl( VarRefVarGen("VarRef"),`VarDecl(${exp.var.var})`),"var") ],
                NewEdges(makeNodeRef(defId), exp.val, "val")
            ]
        ))(DefineVarGen("DefineExp"))
        : isBinding(exp) ? ((bindId: string) => mergeAllEdges(
            [
                [makeEdge(prevNode,makeNodeDecl(bindId,"Binding"), label)],
                [makeEdge(makeNodeRef(bindId), makeNodeDecl(VarRefVarGen("VarRef"), `VarDecl(${exp.var.var})`),"var") ],
                NewEdges(makeNodeRef(bindId), exp.val, "val")
            ]))(BindVarGen("Binding"))
        :[]


//===========================================UNPARSEMERMAID===============================================

    export const unparseMermaid = (exp: Graph): Result<string> => 
        makeOk(`graph ${exp.dir.dir}\n\t`.concat(unparseGraphContent(exp.content)))


    export const unparseGraphContent = (exp: GraphContent): string => 
        isAtomicGraph(exp)? `${exp.node.id}["${exp.node.label}"]` 
        : isCompoundGraph(exp)? unparseCompoundGraph(exp.edges)
        : "never"

    
    export const unparseCompoundGraph = (edges: Edge[]): string => 
        reduce( (str1: string, str2: string) => str1.concat(str2) , ``, map((e: Edge )=>( unparseEdge(e)), edges))


    export const unparseEdge = (edge: Edge): string => 
        isEdge(edge)? 
        (isNodeDecl(edge.from)? `${edge.from.id}["${edge.from.label}"]` : `${edge.from.id}`)
            .concat( ` -->`)
                .concat(isString(edge.label)? `|${edge.label}|` : ``)
                    .concat(isNodeDecl(edge.to)? `${edge.to.id}["${edge.to.label}"]` : `${edge.to.id}`)
                        .concat(`\n\t`)
                        :"1"

//===========================================L4TOMERMAID===============================================
 
export const L4toMermaid = (concrete: string): Result<string>=>
    concrete.startsWith("(L4")? 
    bind( 
        bind(
            parseL4(concrete), 
            (p: Program)=> mapL4toMermaid(p)), 
        (g: Graph) => unparseMermaid(g))
    : bind(
        bind(
            bind(parse(concrete), 
                (x: Sexp) => parseL4Exp(x)),
            (p: Exp)=> mapL4toMermaid(p)),
        (g: Graph) => unparseMermaid(g))
        
        