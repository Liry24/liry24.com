import type { z } from 'zod'

export const useSocial = () => {
    const resource = useSortableResource<
        Serialized<Social>,
        Partial<Social>,
        z.infer<typeof socialsUpdateSchema>
    >({ endpoint: '/api/socials', label: 'Social', getId: (social) => social.id })

    return {
        socials: resource.items,
        changed: resource.changed,
        fetchSocials: resource.refresh,
        createSocial: resource.create,
        updateSocial: resource.update,
        reorderSocials: resource.reorder,
        deleteSocial: resource.remove,
    }
}
