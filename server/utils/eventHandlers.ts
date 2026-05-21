import type { H3Event } from 'h3'
import type { Session } from './auth'

import { getAuth } from './authRuntime'

export const promiseEventHandler = <T = unknown>(
    handler: ({ event }: { event: H3Event }) => Promise<T> | T,
) => eventHandler(async (event) => handler({ event }))

export const sessionEventHandler = <T = unknown>(
    handler: ({ event, session }: { event: H3Event; session: Session | null }) => Promise<T> | T,
) =>
    promiseEventHandler(async ({ event }) => {
        const auth = await getAuth()
        const session = await auth.api.getSession({ headers: event.headers })
        return await handler({ event, session })
    })

export const authedSessionEventHandler = <T = unknown>(
    handler: ({
        event,
        session,
    }: {
        event: H3Event
        session: NonNullable<Session>
    }) => Promise<T> | T,
) =>
    sessionEventHandler(async ({ event, session }) => {
        if (!session) throw serverError.unauthorized()

        return await handler({ event, session })
    })

export const adminSessionEventHandler = <T = unknown>(
    handler: ({
        event,
        session,
    }: {
        event: H3Event
        session: NonNullable<Session>
    }) => Promise<T> | T,
) =>
    sessionEventHandler(async ({ event, session }) => {
        if (!session || session.user.role !== 'admin') throw serverError.forbidden()

        return await handler({ event, session })
    })
