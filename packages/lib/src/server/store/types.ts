import type {
  FieldTypeFromFieldPath,
  GenericDocument,
  IndexTiebreakerField,
  WithoutSystemFields,
} from "convex/server";
import type { GenericId } from "convex/values";

import { BY_STRIPE_ID_INDEX_NAME } from "../schema";

type DocOf<M, T extends keyof M> = M[T] extends { document: infer D }
  ? D
  : never;

type TableInfoOf<M, T extends keyof M> = M[T] extends {
  document: infer D;
  indexes: infer I;
}
  ? { document: D; indexes: I }
  : never;

type IndexFieldsOf<M, T extends keyof M, IndexName extends string> =
  TableInfoOf<M, T> extends {
    indexes: Record<IndexName, infer Fields>;
  }
    ? Fields
    : never;

type IndexNamesOf<M, T extends keyof M> =
  TableInfoOf<M, T> extends {
    indexes: infer Indexes;
  }
    ? Extract<keyof Indexes, string>
    : never;

type StripeIndexFieldPath<M, T extends keyof M> = Exclude<
  IndexFieldsOf<
    M,
    T,
    typeof BY_STRIPE_ID_INDEX_NAME
  > extends readonly (infer Field)[]
    ? Field
    : never,
  IndexTiebreakerField
>;

type IndexFieldPath<M, T extends keyof M, IndexName extends string> = Exclude<
  IndexFieldsOf<M, T, IndexName> extends readonly (infer Field)[]
    ? Field
    : never,
  IndexTiebreakerField
>;

type Keys<D> = Extract<keyof D, string>;
type Operation =
  | "upsert"
  | "deleteById"
  | "selectOne"
  | "selectById"
  | "selectAll";

type UpsertArgsFor<M, T extends keyof M> = {
  [I in IndexNamesOf<M, T>]: {
    [K in IndexFieldPath<M, T, I> & string]: {
      operation: "upsert";
      table: T;
      indexName: I;
      idField: K;
      // @ts-ignore
      data: WithoutSystemFields<DocOf<M, T>> &
        Record<
          K,
          DocOf<M, T> extends GenericDocument
            ? FieldTypeFromFieldPath<DocOf<M, T>, K>
            : never
        >;
    };
  }[IndexFieldPath<M, T, I> & string];
}[IndexNamesOf<M, T>];

type DeleteByIdArgsFor<M, T extends keyof M> = {
  [K in StripeIndexFieldPath<M, T> & string]: {
    operation: "deleteById";
    table: T;
    indexName: typeof BY_STRIPE_ID_INDEX_NAME;
    idField: K;
    idValue: DocOf<M, T> extends GenericDocument
      ? FieldTypeFromFieldPath<DocOf<M, T>, K>
      : never;
  };
}[StripeIndexFieldPath<M, T> & string];

type SelectOneArgsFor<M, T extends keyof M> = {
  [I in IndexNamesOf<M, T>]: {
    [K in IndexFieldPath<M, T, I> & string]: {
      operation: "selectOne";
      table: T;
      indexName: I;
      field: K;
      value: DocOf<M, T> extends GenericDocument
        ? FieldTypeFromFieldPath<DocOf<M, T>, K>
        : never;
    };
  }[IndexFieldPath<M, T, I> & string];
}[IndexNamesOf<M, T>];

type SelectByIdArgsFor<M, T extends keyof M & string> = {
  operation: "selectById";
  table: T;
  id: GenericId<T>;
};

type SelectAllArgsFor<M, T extends keyof M> = {
  operation: "selectAll";
  table: T;
};

export type StoreArgsFor<
  M,
  //   T extends keyof M,
  T extends keyof M & string,
  O extends Operation = Operation,
> = O extends "upsert"
  ? UpsertArgsFor<M, T>
  : O extends "deleteById"
    ? DeleteByIdArgsFor<M, T>
    : O extends "selectOne"
      ? SelectOneArgsFor<M, T>
      : O extends "selectById"
        ? SelectByIdArgsFor<M, T>
        : O extends "selectAll"
          ? SelectAllArgsFor<M, T>
          : never;

export type StoreDispatchArgs<M> = {
  [T in Extract<keyof M, string>]:
    | UpsertArgsFor<M, T>
    | DeleteByIdArgsFor<M, T>
    | SelectOneArgsFor<M, T>
    | SelectByIdArgsFor<M, T>
    | SelectAllArgsFor<M, T>;
}[Extract<keyof M, string>];

export type StoreResultFor<M, A extends StoreDispatchArgs<M>> = A extends {
  operation: "upsert";
  table: infer T extends keyof M & string;
}
  ? { id: GenericId<T> }
  : A extends { operation: "deleteById" }
    ? { deleted: boolean }
    : A extends { operation: "selectOne"; table: infer T extends keyof M }
      ? { doc: DocOf<M, T> | null }
      : A extends { operation: "selectById"; table: infer T extends keyof M }
        ? { doc: DocOf<M, T> | null }
        : A extends { operation: "selectAll"; table: infer T extends keyof M }
          ? { docs: DocOf<M, T>[] }
          : never;
