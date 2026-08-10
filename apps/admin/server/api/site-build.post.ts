export default adminSessionEventHandler(async ({ event }) =>
    triggerSiteBuild(getSiteDeployHook(event)),
)
