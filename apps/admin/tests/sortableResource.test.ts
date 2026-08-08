import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { shallowRef } from 'vue'

import { useSortableResource } from '../app/composables/useSortableResource'

interface Item {
    id: number
    name: string
}

const toast = { add: mock(() => undefined) }
const refresh = mock(async () => undefined)
const request = mock(async () => undefined)
const confirmDelete = mock(() => true)

beforeEach(() => {
    toast.add.mockClear()
    refresh.mockClear()
    request.mockClear()
    confirmDelete.mockClear()

    Object.assign(globalThis, {
        useToast: () => toast,
        useFetch: (
            _endpoint: string,
            options: { onResponse: (value: { response: { _data: Item[] } }) => void },
        ) => {
            const data = shallowRef<Item[]>([
                { id: 1, name: 'one' },
                { id: 2, name: 'two' },
            ])
            options.onResponse({ response: { _data: data.value } })
            return { data, refresh }
        },
        $fetch: request,
        confirm: confirmDelete,
    })
})

afterEach(() => {
    for (const key of ['useToast', 'useFetch', '$fetch', 'confirm'])
        Reflect.deleteProperty(globalThis, key)
})

const createResource = () =>
    useSortableResource<Item, Partial<Item>, Partial<Item>>({
        endpoint: '/api/items',
        label: 'Item',
        getId: (item) => item.id,
    })

describe('sortable resource behavior', () => {
    test('tracks local changes and persists identity order', async () => {
        const resource = createResource()
        expect(resource.changed.value).toBe(false)

        resource.items.value = resource.items.value.toReversed()
        expect(resource.changed.value).toBe(true)

        await resource.reorder()

        expect(request).toHaveBeenCalledWith('/api/items', {
            method: 'PUT',
            body: { order: [2, 1] },
        })
        expect(refresh).toHaveBeenCalledTimes(1)
        expect(toast.add).toHaveBeenCalledWith(
            expect.objectContaining({ color: 'success', title: 'Saved' }),
        )
    })

    test('creates, updates and deletes through the resource endpoint', async () => {
        const resource = createResource()

        await resource.create({ name: 'three' })
        await resource.update('a/b', { name: 'renamed' })
        await resource.remove(2)

        expect(request).toHaveBeenNthCalledWith(1, '/api/items', {
            method: 'POST',
            body: { name: 'three' },
        })
        expect(request).toHaveBeenNthCalledWith(2, '/api/items/a%2Fb', {
            method: 'PATCH',
            body: { name: 'renamed' },
        })
        expect(request).toHaveBeenNthCalledWith(3, '/api/items/2', { method: 'DELETE' })
        expect(refresh).toHaveBeenCalledTimes(3)
    })

    test('does not hide request failures', async () => {
        const failure = new Error('network failed')
        request.mockRejectedValueOnce(failure)
        const consoleError = spyOn(console, 'error').mockImplementation(() => undefined)
        const resource = createResource()

        await expect(resource.create({ name: 'three' })).rejects.toBe(failure)

        expect(refresh).not.toHaveBeenCalled()
        expect(toast.add).toHaveBeenCalledWith(
            expect.objectContaining({ color: 'error', title: 'Error' }),
        )
        consoleError.mockRestore()
    })
})
