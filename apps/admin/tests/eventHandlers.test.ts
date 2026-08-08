import { describe, expect, mock, test } from 'bun:test'

import type { H3Event } from 'h3'

const getSession = mock()
const useDB = mock(() => ({ name: 'database' }))

mock.module('../server/utils/auth.ts', () => ({
    getAuth: async () => ({ api: { getSession } }),
}))
mock.module('../server/utils/database.ts', () => ({ useDB }))

const { adminSessionEventHandler } = await import('../server/utils/eventHandlers')

const event = { headers: new Headers() } as H3Event

describe('admin session handler', () => {
    test('rejects anonymous requests before opening the database', async () => {
        getSession.mockResolvedValueOnce(null)
        const handler = adminSessionEventHandler(() => 'unreachable')

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
        expect(useDB).not.toHaveBeenCalled()
    })

    test('rejects members before opening the database', async () => {
        getSession.mockResolvedValueOnce({ user: { role: 'member' } })
        const handler = adminSessionEventHandler(() => 'unreachable')

        await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
        expect(useDB).not.toHaveBeenCalled()
    })

    test('allows admins and supplies their session and database', async () => {
        const session = { user: { id: 'admin_1', role: 'admin' } }
        getSession.mockResolvedValueOnce(session)
        const handler = adminSessionEventHandler(({ db, session: received }) => ({ db, received }))

        await expect(handler(event)).resolves.toEqual({ db: { name: 'database' }, received: session })
    })
})
