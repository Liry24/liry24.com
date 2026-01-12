import type { H3Event } from 'h3'
import { getReasonPhrase, StatusCodes } from 'http-status-codes'

export const sessionEventHandler = <T = unknown>(
    handler: ({ event, session }: { event: H3Event; session: Session | null }) => Promise<T> | T
) =>
    eventHandler(async (event) => {
        const session = await auth.api.getSession({ headers: event.headers })

        return handler({ event, session })
    })

export const authedSessionEventHandler = <T = unknown>(
    handler: ({
        event,
        session,
    }: {
        event: H3Event
        session: NonNullable<Session>
    }) => Promise<T> | T
) =>
    sessionEventHandler(async ({ event, session }) => {
        if (!session)
            throw createError({
                statusCode: StatusCodes.UNAUTHORIZED,
                statusMessage: getReasonPhrase(StatusCodes.UNAUTHORIZED),
            })

        return handler({ event, session })
    })

export const adminSessionEventHandler = <T = unknown>(
    handler: ({
        event,
        session,
    }: {
        event: H3Event
        session: NonNullable<Session>
    }) => Promise<T> | T
) =>
    sessionEventHandler(async ({ event, session }) => {
        if (session?.user?.role !== 'admin')
            throw createError({
                statusCode: StatusCodes.FORBIDDEN,
                statusMessage: getReasonPhrase(StatusCodes.FORBIDDEN),
            })

        return handler({ event, session })
    })
