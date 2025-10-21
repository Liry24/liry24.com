<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { EffectComposerPmndrs, ASCIIPmndrs } from '@tresjs/post-processing'
import { BlendFunction } from 'postprocessing'
import { useDeviceOrientation } from '@vueuse/core'

// Camera angle sensitivity
const CAMERA_SENSITIVITY = 0.3
const CAMERA_OFFSET = { x: 1, y: 1 }
const DEVICE_ORIENTATION_SENSITIVITY = 0.02
const BASE_ORIENTATION = { beta: 60, gamma: 0 }

const mousePos = reactive({ x: 0, y: 0 })
const targetLookAt = reactive({ x: CAMERA_OFFSET.x, y: CAMERA_OFFSET.y })
const lookAt = reactive({ x: CAMERA_OFFSET.x, y: -CAMERA_OFFSET.y })

// Easing factor (0-1, lower = smoother)
const EASE_FACTOR = 0.1

// Pixel ratio (limit to max 2 for performance on high DPI devices)
const pixelRatio = ref(1)

let animationFrameId: number | null = null

// Device orientation
const { isSupported, beta, gamma } = useDeviceOrientation()

const handleMouseMove = (event: MouseEvent) => {
    // Skip mouse control if device orientation is available
    if (isSupported.value && beta.value !== null && gamma.value !== null) return

    // Normalize mouse position to -1 to 1 range
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1

    // Calculate target look-at position based on mouse
    targetLookAt.x = CAMERA_OFFSET.x + mousePos.x * CAMERA_SENSITIVITY
    targetLookAt.y = CAMERA_OFFSET.y + mousePos.y * CAMERA_SENSITIVITY
}

// Watch device orientation and update target look-at position
watch([beta, gamma], ([betaValue, gammaValue]) => {
    if (betaValue !== null && gammaValue !== null) {
        // beta: -180 to 180 (front-back tilt)
        // gamma: -90 to 90 (left-right tilt)
        // Calculate relative angle from base orientation
        const relativeBeta = betaValue - BASE_ORIENTATION.beta
        const relativeGamma = gammaValue - BASE_ORIENTATION.gamma

        targetLookAt.x =
            CAMERA_OFFSET.x + relativeGamma * DEVICE_ORIENTATION_SENSITIVITY
        targetLookAt.y =
            CAMERA_OFFSET.y + relativeBeta * DEVICE_ORIENTATION_SENSITIVITY
    }
})

const animate = () => {
    // Apply easing to look-at position
    lookAt.x += (targetLookAt.x - lookAt.x) * EASE_FACTOR
    lookAt.y += (targetLookAt.y * -1 - lookAt.y) * EASE_FACTOR

    animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
    pixelRatio.value = Math.min(window.devicePixelRatio, 2)

    window.addEventListener('mousemove', handleMouseMove)
    animate()
})

onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
    <TresCanvas
        render-mode="always"
        :clearAlpha="0"
        :dpr="pixelRatio"
        shadows
        cast-shadow
        window-size
    >
        <TresPerspectiveCamera
            :position="[2, 0, 0]"
            :look-at="[0, lookAt.y, lookAt.x]"
        />

        <TresAmbientLight :intensity="1" />

        <TresDirectionalLight
            :intensity="8"
            :position="[40, 40, -40]"
            :look-at="[0, 0, 0]"
            cast-shadow
        />

        <TresMesh :position="[0, 0, 0]" cast-shadow receive-shadow>
            <TresSphereGeometry :radius="3" />
            <TresMeshStandardMaterial color="#aaaaaa" />
        </TresMesh>

        <Suspense>
            <EffectComposerPmndrs :multisampling="4">
                <ASCIIPmndrs
                    :blend-function="BlendFunction.SRC"
                    :ascii-texture="{
                        characters: ' .:-*+=#%@',
                    }"
                    color="#444444"
                />
            </EffectComposerPmndrs>
        </Suspense>
    </TresCanvas>
</template>
