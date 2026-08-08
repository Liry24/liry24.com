import { createError, eventHandler, type H3Event } from 'h3'

import { getAuth } from './auth'
import { useDB } from './database'

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
    eventHandler(async (event) => {
        const auth = await getAuth()
        const session = await auth.api.getSession({ headers: event.headers })
        if (!session || session.user.role !== 'admin')
            throw createError({ status: 403, statusText: 'Forbidden' })

        const db = useDB()
        return await handler({ event, session, db })
    })
