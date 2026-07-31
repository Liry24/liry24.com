import { vMotion } from 'motion-v'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.directive('motion', vMotion)
})
