import type { z } from 'zod'

const throwIfFailed = <T>(
    tag: string,
    result: z.ZodSafeParseSuccess<T> | z.ZodSafeParseError<unknown>,
): T => {
    if (!result.success) {
        if (import.meta.dev) console.error(tag, result.error)
        throw createError({ status: 400, statusText: 'Bad Request', message: 'Validation Error' })
    }
    return result.data
}

export const validateBody = async <T extends z.ZodTypeAny>(s: T): Promise<z.infer<T>> =>
    throwIfFailed(
        'validateBody',
        await readValidatedBody(useEvent(), (body) => s.safeParse(body)),
    )

export const validateParams = async <T extends z.ZodTypeAny>(s: T): Promise<z.infer<T>> =>
    throwIfFailed(
        'validateParams',
        await getValidatedRouterParams(useEvent(), (p) => s.safeParse(p)),
    )

export const validateQuery = async <T extends z.ZodTypeAny>(s: T): Promise<z.infer<T>> =>
    throwIfFailed('validateQuery', await getValidatedQuery(useEvent(), (q) => s.safeParse(q)))
