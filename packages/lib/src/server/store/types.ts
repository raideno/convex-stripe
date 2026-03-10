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

// Resolves to `true` only if the table has the stripe ID index
type HasStripeIndex<M, T extends keyof M> =
  typeof BY_STRIPE_ID_INDEX_NAME extends IndexNamesOf<M, T> ? true : false;

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

// Builds an indexValues object type for all fields in an index, where each
// field maps to the corresponding document field type.
type IndexValuesFor<M, T extends keyof M, IndexName extends string> = {
  [K in IndexFieldPath<M, T, IndexName> & string]?: DocOf<
    M,
    T
  > extends GenericDocument
    ? FieldTypeFromFieldPath<DocOf<M, T>, K>
    : never;
};

type Operation =
  | "upsert"
  | "insert"
  | "deleteById"
  | "selectOne"
  | "selectById"
  | "selectAll";

// Requires the table to have the stripe index; otherwise resolves to `never`
type UpsertArgsFor<M, T extends keyof M> =
  HasStripeIndex<M, T> extends true
    ? {
        [I in IndexNamesOf<M, T>]: {
          operation: "upsert";
          table: T;
          indexName: I;
          indexValues: IndexValuesFor<M, T, I>;
          // @ts-ignore
          data: WithoutSystemFields<DocOf<M, T>>;
        };
      }[IndexNamesOf<M, T>]
    : never;

type InsertArgsFor<M, T extends keyof M> = {
  operation: "insert";
  table: T;
  // @ts-ignore
  data: WithoutSystemFields<DocOf<M, T>>;
};

// Requires the table to have the stripe index; otherwise resolves to `never`
type DeleteByIdArgsFor<M, T extends keyof M> =
  HasStripeIndex<M, T> extends true
    ? {
        operation: "deleteById";
        table: T;
        indexName: typeof BY_STRIPE_ID_INDEX_NAME;
        indexValues: {
          [K in StripeIndexFieldPath<M, T> & string]?: DocOf<
            M,
            T
          > extends GenericDocument
            ? FieldTypeFromFieldPath<DocOf<M, T>, K>
            : never;
        };
      }
    : never;

type SelectOneArgsFor<M, T extends keyof M> = {
  [I in IndexNamesOf<M, T>]: {
    operation: "selectOne";
    table: T;
    indexName: I;
    indexValues: IndexValuesFor<M, T, I>;
  };
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
  T extends keyof M & string,
  O extends Operation = Operation,
> = O extends "upsert"
  ? UpsertArgsFor<M, T>
  : O extends "insert"
    ? InsertArgsFor<M, T>
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
    | InsertArgsFor<M, T>
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
  : A extends { operation: "insert"; table: infer T extends keyof M & string }
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
