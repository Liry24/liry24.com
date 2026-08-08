import type { H3Event } from 'h3'

import { useDB } from './database'

export const promiseEventHandler = <T = unknown>(
    handler: ({ event, db }: { event: H3Event; db: ReturnType<typeof useDB> }) => Promise<T> | T,
) => {
    return eventHandler(async (event) => {
        const db = useDB()
        return handler({ event, db })
    })
}

export const sessionEventHandler = <T = unknown>(
    handler: ({
        event,
        session,
        db,
    }: {
        event: H3Event
        session: Session | null
        db: ReturnType<typeof useDB>
    }) => Promise<T> | T,
) =>
    promiseEventHandler(async ({ event, db }) => {
        const auth = await getAuth()
        const session = await auth.api.getSession({ headers: event.headers })
        return await handler({ event, session, db })
    })

export const authedSessionEventHandler = <T = unknown>(
    handler: ({
        event,
        session,
        db,
    }: {
        event: H3Event
        session: NonNullable<Session>
        db: ReturnType<typeof useDB>
    }) => Promise<T> | T,
) =>
    sessionEventHandler(async ({ event, session, db }) => {
        if (!session) throw serverError.unauthorized()

        return await handler({ event, session, db })
    })

export const adminSessionEventHandler = <T = unknown>(
    handler: ({
        event,
        session,
        db,
    }: {
        event: H3Event
        session: NonNullable<Session>
        db: ReturnType<typeof useDB>
    }) => Promise<T> | T,
) =>
    sessionEventHandler(async ({ event, session, db }) => {
        if (!session || session.user.role !== 'admin') throw serverError.forbidden()

        return await handler({ event, session, db })
    })
