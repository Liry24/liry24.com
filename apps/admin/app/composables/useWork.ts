import type { z } from 'zod'

export const useWork = () => {
    const resource = useSortableResource<
        Serialized<Work>,
        Partial<Work>,
        z.infer<typeof worksUpdateSchema>
    >({ endpoint: '/api/works', label: 'Work', getId: (work) => work.slug })
    const categories = computed<string[]>(() =>
        [...new Set(resource.items.value.map((work) => work.category))].filter(
            (category): category is string => !!category,
        ),
    )

    return {
        works: resource.items,
        changed: resource.changed,
        categories,
        fetchWorks: resource.refresh,
        createWork: resource.create,
        updateWork: resource.update,
        reorderWorks: resource.reorder,
        deleteWork: resource.remove,
    }
}
