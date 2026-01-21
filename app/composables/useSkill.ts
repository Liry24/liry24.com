export const useSkill = () => {
    const toast = useToast()

    const skills = useState<Serialized<Skill>[]>('skills', () => [])
    const originalSkills = useState<Serialized<Skill>[]>('skills-original', () => [])

    const submitting = ref<{
        state: boolean
        progress: number
        logs: ConsoleLog[]
    }>({
        state: false,
        progress: 0,
        logs: [],
    })

    const fetchSkills = async () => {
        const { data } = await useFetch('/api/skills', {
            key: 'skills-list',
            default: () => [],
        })

        if (data.value) {
            skills.value = [...data.value]
            originalSkills.value = [...data.value]
        }
    }

    const saveSkill = async (state: Partial<Skill>) => {
        submitting.value.state = true
        submitting.value.progress = 0
        submitting.value.logs = []

        try {
            if (state.id)
                await $fetch('/api/admin/skills', {
                    method: 'PATCH',
                    body: state,
                })
            else
                await $fetch('/api/admin/skills', {
                    method: 'POST',
                    body: state,
                })

            submitting.value.progress = 100

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Success',
                description: 'Skill saved successfully',
                color: 'success',
            })

            await fetchSkills()
        } catch (e) {
            console.error(e)
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'An error occurred while saving the skill',
                color: 'error',
            })
            throw e
        } finally {
            submitting.value.state = false
        }
    }

    const deleteSkill = async (item: Serialized<Skill>) => {
        const index = skills.value.findIndex((s) => s.id === item.id)
        if (index > -1) {
            skills.value.splice(index, 1)
        }
    }

    const reorderSkills = async () => {
        try {
            await $fetch('/api/admin/skills', {
                method: 'PUT',
                body: {
                    skills: skills.value,
                },
            })

            await fetchSkills()

            toast.add({
                icon: 'mingcute:check-line',
                title: 'Saved',
                description: 'Your changes have been saved',
                color: 'success',
            })
        } catch {
            toast.add({
                icon: 'mingcute:close-line',
                title: 'Error',
                description: 'Failed to save changes',
                color: 'error',
            })
        }
    }

    return {
        skills,
        originalSkills,
        fetchSkills,
        saveSkill,
        deleteSkill,
        reorderSkills,
        submitting,
    }
}
