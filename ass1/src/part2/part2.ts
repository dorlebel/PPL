import {map, compose, reduce, reduceRight, identity, filter} from 'ramda'
/* Question 1 */
export const partition: <T> (a:T[],f : (x : T) => boolean) => T[][] = 
(a,f) => [filter(f,a),filter((x)=> !f(x), a)]; 

/* Question 2 */
export const mapMat: <T>(mat: T[][],f : (x : T) => T) => T[][] = 
(mat,f) => map((parm)=> map(f,parm),mat);//parm with no type, problem.

/* Question 3 */
export const composeMany: <T>(arr: ((x: T)=> T)[]) => ((x : T) => T) = 
(arr) => arr.reduce((f1, f2)=> compose(f1,f2),(x)=>x);

/* Question 4 */
interface Languages {
    english: string;
    japanese: string;
    chinese: string;
    french: string;
}

interface Stats {
    HP: number;
    Attack: number;
    Defense: number;
    "Sp. Attack": number;
    "Sp. Defense": number;
    Speed: number;
}

interface Pokemon {
    id: number;
    name: Languages;
    type: string[];
    base: Stats;
}

export const maxSpeed: (dex : Pokemon[]) => Pokemon[] =
// (dex) =>  map((x: Pokemon) => x.type,filter((p1 : Pokemon) => p1.base.Speed == reduce((s1,s2 : number)=> Math.max(s1,s2),1,map((p) => p.base.Speed,dex)), dex));
(dex) => filter((p1 : Pokemon) => p1.base.Speed === reduce((s1,s2 : number)=> Math.max(s1,s2),1,map((p) => p.base.Speed,dex)), dex);


export const grassTypes: (dex : Pokemon[]) => string[] =
(dex) => (map((x: Pokemon) => x.name.english ,filter( (x:Pokemon) => x.type.includes("Grass"),dex))).sort();

export const uniqueTypes : (dex : Pokemon[]) => string[] =
(dex) => 
((reduce((a1: string[],a2: string[])=> a1.concat(a2), [],map((x: Pokemon) => x.type , dex))).sort()).
reduce((arr: string[], type : string) => arr.includes(type)? arr: [...arr,type],[]);

