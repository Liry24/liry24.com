import type { z } from 'zod'

export const useArt = () => {
    const resource = useSortableResource<
        Serialized<Art>,
        Partial<Art>,
        z.infer<typeof artsUpdateSchema>
    >({
        endpoint: '/api/arts',
        label: 'Art',
        getId: (art) => art.slug,
    })

    return {
        arts: resource.items,
        changed: resource.changed,
        fetchArts: resource.refresh,
        createArt: resource.create,
        updateArt: resource.update,
        reorderArts: resource.reorder,
        deleteArt: resource.remove,
    }
}
