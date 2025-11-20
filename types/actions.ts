// /types/actions.ts

/**
 * The standard shape your actions return:
 *
 * {
 *   success: boolean;
 *   data: T | null;
 *   error: string | null;
 * }
 */
export type ActionResult<T> = {
    success: boolean;
    data: T | null;
    error: string | null;
};

/* --------------------------------------------------------------
 * 🔍 Generic Extractor Helpers
 * -------------------------------------------------------------- */

/**
 * Extracts the entire `data` type from an action.
 *
 * Example:
 * type MembersData = InferActionData<typeof getCompanyAdminMembers>;
 */
export type InferActionData<TAction extends (...args: any) => any> =
    NonNullable<Awaited<ReturnType<TAction>>['data']>;

/**
 * Extract a nested field from `data`.
 *
 * Example:
 * type Members = InferActionField<typeof getCompanyAdminMembers, "members">;
 */
export type InferActionField<
    TAction extends (...args: any) => any,
    TKey extends keyof InferActionData<TAction>
> = InferActionData<TAction>[TKey];

/**
 * Extracts the error type (always string | null).
 */
export type InferActionError<TAction extends (...args: any) => any> = Awaited<
    ReturnType<TAction>
>['error'];

/**
 * Extracts the success boolean.
 */
export type InferActionSuccess<TAction extends (...args: any) => any> = Awaited<
    ReturnType<TAction>
>['success'];
