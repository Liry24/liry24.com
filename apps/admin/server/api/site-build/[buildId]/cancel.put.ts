import z from 'zod'

const request = { params: z.object({ buildId: z.string().uuid() }) }

export default adminSessionEventHandler(async ({ event }) => {
    const { buildId } = await validateParams(request.params)
    return cancelSiteBuild(getSiteBuildConfig(event), buildId)
})
