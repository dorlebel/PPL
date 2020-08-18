const f = (x: number) : Promise<number> => {
    return new Promise<number>( function (resolve, reject) {
          if ( x === 0 )
            reject("Error: lligal devision by 0");
          else
            resolve( 1/x );
         })
}

const g = (x: number) : Promise<number> => {
    return new Promise<number>( function (resolve, reject) {
            resolve( x * x );
         })
}

const h = (x: number) : Promise<number> => {
    return new Promise<number>( function (resolve, reject) {
          g(x).then( y => f(y)
                .then( z => resolve(z))
                .catch(z => reject(z)))
              .catch(y =>reject(y));
         })
}


//4.2:
const slower = (promises: Promise<any>[]): Promise<any[]> => {
    let isOtherPFaster : Boolean = false;
    return new Promise<any[]>( function (resolve, reject) {
        promises[0].then( v => (isOtherPFaster? resolve([0, v]) :
                                                isOtherPFaster = true))
                   .catch( v => reject(console.log(v)));
        promises[1].then( v => (isOtherPFaster? resolve([1, v]) :
                                                isOtherPFaster = true))
                   .catch( v => reject(console.log(v)));
    })
}