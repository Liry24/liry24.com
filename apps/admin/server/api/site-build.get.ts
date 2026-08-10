export default adminSessionEventHandler(async ({ event }) => ({
    build: await getLatestSiteBuild(getSiteBuildConfig(event)),
}))
