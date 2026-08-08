import { createError } from 'h3'

export type SortIndex<T> = { id: T; sortIndex: number }

export const toSortIndexes = <T>(order: T[]): SortIndex<T>[] =>
    order.map((id, sortIndex) => ({ id, sortIndex }))

export const reorderRecords = async <T>({
    order,
    current,
    update,
}: {
    order: T[]
    current: T[]
    update: (items: SortIndex<T>[]) => Promise<unknown>
}) => {
    const expected = new Set(current)
    if (
        order.length !== current.length ||
        new Set(order).size !== order.length ||
        order.some((id) => !expected.has(id))
    )
        throw createError({ statusCode: 400, statusMessage: 'Invalid sort order' })

    const items = toSortIndexes(order)
    if (items.length) await update(items)
}
