import type { z } from 'zod'

export const useCareer = () => {
    const resource = useSortableResource<
        Serialized<Career>,
        Partial<Career>,
        z.infer<typeof careersUpdateSchema>
    >({ endpoint: '/api/careers', label: 'Career', getId: (career) => career.id })

    return {
        careers: resource.items,
        changed: resource.changed,
        fetchCareers: resource.refresh,
        createCareer: resource.create,
        updateCareer: resource.update,
        reorderCareers: resource.reorder,
        deleteCareer: resource.remove,
    }
}
