import type { z } from 'zod'

export const useRank = () => {
    const resource = useSortableResource<
        Serialized<Rank>,
        Partial<Rank>,
        z.infer<typeof ranksUpdateSchema>
    >({ endpoint: '/api/ranks', label: 'Rank', getId: (rank) => rank.id })

    return {
        ranks: resource.items,
        changed: resource.changed,
        fetchRanks: resource.refresh,
        createRank: resource.create,
        updateRank: resource.update,
        reorderRanks: resource.reorder,
        deleteRank: resource.remove,
    }
}
