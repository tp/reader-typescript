/**
 * Reader example
 */
type Reader<T, R = void> = (env: T) => R; // Does it or its Env need to be tagged to be not easily mixed with other functions? // & { readonly __readerTag: unique symbol };

type ReaderT<R> = R extends Reader<infer T, any> ? T : never;
type ReaderTOfFunc<F> = F extends (...args: any[]) => Reader<infer T, any>
  ? T
  : never;


// type x = ReaderTOfFunc<typeof readFromDB>;
// type y = ReaderTOfFunc<typeof readFromNetwork>;
// type z = Reader<x & y>;
// type T = ReaderT<Reader<{ db: 1 }, string>>;

function readBlockingFromDB(key: string): Reader<{ db: number }, string> {
  return env => {
    return `DB value for key ${key} from DB ${env.db}`;
  };
}

function readFromNetworkAsync(
  key: string
): Reader<{ endpoint: string }, Promise<string>> {
  return env => {
    return Promise.resolve(
      `Network retrieved data for ${key} from ${env.endpoint}`
    );
  };
}

type r1 = ReaderT<typeof readBlockingFromDB>;

type env = ReaderT<typeof readBlockingFromDB & typeof readFromNetworkAsync>;

function readData(
  key: string
): Reader<
  ReaderTOfFunc<typeof readBlockingFromDB> &
    ReaderTOfFunc<typeof readFromNetworkAsync>,
  Promise<[string, string]>
> {
  return async env => {
    const dbValue = readBlockingFromDB(key)(env);
    const networkValue = await readFromNetworkAsync(key)(env);

    return [dbValue, networkValue];
  };
}

(async function main() {
  console.error(await readData(`x`)({ db: 5, endpoint: "example.com" }));
})();
