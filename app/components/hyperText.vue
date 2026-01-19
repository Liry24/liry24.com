<script setup lang="ts">
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

interface Props {
    text: string
    case?: 'upper' | 'lower'
    duration?: number
    animateOnLoad?: boolean
    as?: string
    class?: HTMLAttributes['class']
}
const props = withDefaults(defineProps<Props>(), {
    case: 'lower',
    duration: 800,
    animateOnLoad: false,
    as: 'span',
    class: undefined,
})

const emit = defineEmits(['mouseenter', 'mouseleave'])

const alphabets = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
}
const displayText = ref(props.text.split(''))
const iterations = ref(0)

const getRandomLetter = () =>
    alphabets[props.case][Math.floor(Math.random() * alphabets[props.case].length)] || ''

const triggerAnimation = () => {
    iterations.value = 0
    startAnimation()
}

const { pause, resume } = useIntervalFn(
    () => {
        if (iterations.value < props.text.length) {
            displayText.value = displayText.value.map((l, i) =>
                l === ' ' ? l : i <= iterations.value ? (props.text[i] ?? '') : getRandomLetter()
            )
            iterations.value += 0.1
        } else {
            pause()
        }
    },
    computed(() => props.duration / (props.text.length * 10))
)

const startAnimation = () => {
    pause()
    resume()
}

watch(
    () => props.text,
    (newText) => {
        displayText.value = newText.split('')
        triggerAnimation()
    }
)

if (props.animateOnLoad) triggerAnimation()
</script>

<template>
    <Primitive
        :as="props.as"
        :class="cn('flex', props.class)"
        @mouseenter="emit('mouseenter')"
        @mouseleave="emit('mouseleave')"
    >
        <Motion
            v-for="(letter, i) in displayText"
            :key="i"
            as="span"
            :delay="i * (duration / (text.length * 10))"
            :class="cn('inline-block', letter === ' ' ? 'w-3' : '')"
        >
            {{ letter }}
        </Motion>
    </Primitive>
</template>
