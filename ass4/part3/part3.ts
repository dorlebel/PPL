
// 3.1

function* braid(generator1 : ()=> Generator, generator2 : ()=> Generator) {
    let it1 : Iterator<any> = generator1();
    let it2 : Iterator<any> = generator2();
    let result1 : IteratorResult<any> = it1.next();
    let result2 : IteratorResult<any> = it2.next();
    while ( !result1.done || !result2.done){
        if ( !result1.done ){
            yield result1.value;
            result1 = it1.next();
        }
        if ( !result2.done ){
            yield result2.value;
            result2 = it2.next();
        }
    }
}

//3.2

function* biased(generator1 : ()=> Generator, generator2 : ()=> Generator) {
    let it1 : Iterator<any> = generator1();
    let it2 : Iterator<any> = generator2();
    let result1 : IteratorResult<any> = it1.next();
    let result2 : IteratorResult<any> = it2.next();
    while ( !result1.done || !result2.done){
        if ( !result1.done ){
            yield result1.value;
            result1 = it1.next();
            if ( !result1.done ){
                yield result1.value;
                result1 = it1.next();
            }
        }
        if ( !result2.done ){
            yield result2.value;
            result2 = it2.next();
            if ( !result2.done ){
                yield result2.value;
                result2 = it2.next();
            }
        }
    }
}