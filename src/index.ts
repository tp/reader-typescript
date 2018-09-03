/**
 * Reader example
 */

interface Reader<E, R> {
  ask: (env: E) => E;
  run: (env: E) => R;
  map: <T>(f: (r: R) => T) => Reader<E, T>;
  flatMap: <T>(f: (res: R) => Reader<E, T>) => Reader<E, T>;
  zip: <T, E2>(r2: Reader<E2, T>) => Reader<E & E2, [R, T]>;
}

function Reader<In, Data>(f: (env: In) => Data): Reader<In, Data> {
  return {
    ask: env => env,
    run: env => f(env),
    map: <T>(mapF: (r: Data) => T): Reader<In, T> => {
      return Reader((env: In) => {
        return mapF(f(env));
      });
    },
    flatMap: mapF => {
      return Reader(env => mapF(f(env)).run(env));
    },
    zip: <In2, Data2>(r2: Reader<In2, Data2>) => {
      return Reader(
        (env: In & In2): [Data, Data2] => {
          return [f(env), r2.run(env)];
        }
      );
    }
  };
}

// type x = ReaderTOfFunc<typeof readFromDB>;
// type y = ReaderTOfFunc<typeof readFromNetwork>;
// type z = Reader<x & y>;
// type T = ReaderT<Reader<{ db: 1 }, string>>;

function readBlockingFromDB(key: string) {
  return Reader<{ db: number }, string>(env => {
    return `DB value for key ${key} from DB ${env.db}`;
  });
}

function readFromNetworkAsync(key: string) {
  return Reader<{ endpoint: string }, Promise<string>>(env => {
    return Promise.resolve(
      `Network retrieved data for ${key} from ${env.endpoint}`
    );
  });
}

type ReaderT<R> = R extends Reader<infer T, any> ? T : never;
type ReaderTOfFunc<F> = F extends (...args: any[]) => Reader<infer T, any>
  ? T
  : never;

type r1 = ReaderT<typeof readBlockingFromDB>;

type env = ReaderT<typeof readBlockingFromDB & typeof readFromNetworkAsync>;

function readData(key: string) {
  return Reader<
    ReaderTOfFunc<typeof readBlockingFromDB> &
      ReaderTOfFunc<typeof readFromNetworkAsync>,
    Promise<[string, string]>
  >(async env => {
    const dbValue = readBlockingFromDB(key).run(env);
    const networkValue = await readFromNetworkAsync(key).run(env);

    return [dbValue, networkValue];
  });
}

(async function main() {
  console.error(await readData(`x`).run({ db: 5, endpoint: "example.com" }));
})();

(async function main2() {
  const key = "abc";

  console.error(
    readBlockingFromDB(key)
      .zip(readFromNetworkAsync(key))
      // .flatMap((res: [string, Promise<string>]) = {
      //   return Reader(env => {
      //     await
      //   })
      // })
      .run({ db: 5, endpoint: "example.com" })
  );
})();
