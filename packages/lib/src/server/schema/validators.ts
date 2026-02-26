import { Infer, v, Validator } from "convex/values";

export type ArgSchema = Record<
    string,
    Validator<any, "optional" | "required", any>
>;

export type InferArgs<S extends ArgSchema> = {
    [K in keyof S as S[K] extends Validator<any, "required", any>
    ? K
    : never]: Infer<S[K]>;
} & {
    [K in keyof S as S[K] extends Validator<any, "optional", any>
    ? K
    : never]?: Infer<S[K]>;
};

export const nullablestring = () => v.union(v.string(), v.null());
export const nullableboolean = () => v.union(v.boolean(), v.null());
export const nullablenumber = () => v.union(v.number(), v.null());
export const metadata = () =>
    v.record(v.string(), v.union(v.string(), v.number(), v.null()));
export const optionalnullableobject = <T extends ArgSchema>(object: T) =>
    v.optional(v.union(v.object(object), v.null()));
export const optionalany = () => v.optional(v.any());
