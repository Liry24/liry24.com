import type { z } from 'zod'

export const useSkill = () => {
    const resource = useSortableResource<
        Serialized<Skill>,
        Partial<Skill>,
        z.infer<typeof skillsUpdateSchema>
    >({ endpoint: '/api/skills', label: 'Skill', getId: (skill) => skill.id })
    const categories = computed<string[]>(() =>
        [...new Set(resource.items.value.map((skill) => skill.category))].filter(
            (category): category is string => !!category,
        ),
    )

    return {
        skills: resource.items,
        changed: resource.changed,
        categories,
        fetchSkills: resource.refresh,
        createSkill: resource.create,
        updateSkill: resource.update,
        reorderSkills: resource.reorder,
        deleteSkill: resource.remove,
    }
}
