import { describe, expect, test } from 'bun:test'

import { getChatGptCimdMetadata } from '../server/utils/chatGptCimd'

describe('ChatGPT CIMD compatibility', () => {
    test('derives the callback only from a strict ChatGPT client metadata URL', () => {
        expect(
            getChatGptCimdMetadata('https://chatgpt.com/oauth/oz_CMSGj4vHi/client.json'),
        ).toEqual({
            clientId: 'https://chatgpt.com/oauth/oz_CMSGj4vHi/client.json',
            redirectUri: 'https://chatgpt.com/connector/oauth/oz_CMSGj4vHi',
        })
    })

    test.each([
        'http://chatgpt.com/oauth/oz_test/client.json',
        'https://evil.example/oauth/oz_test/client.json',
        'https://chatgpt.com/oauth/not-a-connector/client.json',
        'https://chatgpt.com/oauth/oz_test/client.json?redirect=https://evil.example',
        'https://chatgpt.com/oauth/oz_test/client.json#fragment',
    ])('rejects an untrusted client id: %s', (clientId) => {
        expect(getChatGptCimdMetadata(clientId)).toBeNull()
    })
})
