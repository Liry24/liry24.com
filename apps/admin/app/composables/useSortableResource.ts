import equal from 'fast-deep-equal'
import { computed, shallowRef } from 'vue'

type ResourceId = number | string

interface SortableResourceOptions<T> {
    endpoint: string
    label: string
    getId: (item: T) => ResourceId
}

export const useSortableResource = <T, Create, Update>({
    endpoint,
    label,
    getId,
}: SortableResourceOptions<T>) => {
    const toast = useToast()
    const original = shallowRef<T[]>([])
    const { data: items, refresh } = useFetch<T[]>(endpoint, {
        dedupe: 'defer',
        default: () => [],
        onResponse: ({ response }) => {
            original.value = structuredClone((response._data as T[] | undefined) ?? [])
        },
    })

    original.value = structuredClone(items.value)

    const changed = computed(() => !equal(items.value, original.value))
    const resource = label.toLowerCase()

    const saved = () =>
        toast.add({
            icon: 'mingcute:check-line',
            title: 'Success',
            description: `${label} saved successfully`,
            color: 'success',
        })

    const failed = (action: 'saving' | 'deleting') =>
        toast.add({
            icon: 'mingcute:close-line',
            title: 'Error',
            description: `An error occurred while ${action} the ${resource}`,
            color: 'error',
        })

    const create = async (state: Create) => {
        try {
            await $fetch(endpoint, {
                method: 'POST',
                body: state as Record<string, unknown>,
            })
            saved()
            await refresh()
        } catch (error) {
            console.error(error)
            failed('saving')
            throw error
        }
    }

    const update = async (id: ResourceId, state: Update) => {
        try {
            await $fetch(`${endpoint}/${encodeURIComponent(String(id))}`, {
                method: 'PATCH',
                body: state as Record<string, unknown>,
            })
            await refresh()
            saved()
        } catch (error) {
            console.error(error)
            failed('saving')
            throw error
        }
    }

    const reorder = async () => {
        try {
            await $fetch(endpoint, {
                method: 'PUT',
                body: { order: items.value.map(getId) },
            })
            await refresh()
            toast.add({
                icon: 'mingcute:check-line',
                title: 'Saved',
                description: 'Your changes have been saved',
                color: 'success',
            })
        } catch (error) {
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'Failed to save changes',
                color: 'error',
            })
            throw error
        }
    }

    const remove = async (id: ResourceId) => {
        if (!confirm(`Are you sure you want to delete this ${resource}?`)) return

        try {
            await $fetch(`${endpoint}/${encodeURIComponent(String(id))}`, { method: 'DELETE' })
            await refresh()
            toast.add({
                icon: 'mingcute:check-line',
                title: 'Success',
                description: `${label} deleted successfully`,
                color: 'success',
            })
        } catch (error) {
            console.error(error)
            failed('deleting')
            throw error
        }
    }

    return { items, changed, refresh, create, update, reorder, remove }
}
