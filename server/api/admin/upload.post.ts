import { handleClientUpload } from '@tigrisdata/storage'

export default adminSessionEventHandler(async ({ event }) => {
    const body = await readBody(event)
    return handleClientUpload(body)
})
