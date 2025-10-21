<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { EffectComposerPmndrs, ASCIIPmndrs } from '@tresjs/post-processing'
import { BlendFunction } from 'postprocessing'

// Camera angle sensitivity
const CAMERA_SENSITIVITY = 0.2

const mousePos = reactive({ x: 0, y: 0 })
const targetCameraPos = reactive({ x: 1, y: 1 })
const cameraPos = reactive({ x: 0, y: 0 })

// Easing factor (0-1, lower = smoother)
const EASE_FACTOR = 0.1

let animationFrameId: number | null = null

const handleMouseMove = (event: MouseEvent) => {
    // Normalize mouse position to -1 to 1 range
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1

    // Calculate target camera position based on mouse
    targetCameraPos.x = 1 + mousePos.x * CAMERA_SENSITIVITY
    targetCameraPos.y = 1 + mousePos.y * CAMERA_SENSITIVITY
}

const animate = () => {
    // Apply easing to camera position
    cameraPos.x += (targetCameraPos.x - cameraPos.x) * EASE_FACTOR
    cameraPos.y += (targetCameraPos.y - cameraPos.y) * EASE_FACTOR

    animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
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
        shadows
        cast-shadow
        window-size
    >
        <TresPerspectiveCamera
            :position="[cameraPos.x, cameraPos.y, 1]"
            :look-at="[-1, -2, 1]"
        />

        <TresAmbientLight :intensity="1" />

        <TresDirectionalLight
            :intensity="8"
            :position="[40, 100, -10]"
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
                        characters: ' .:-+*=#%@',
                    }"
                    color="#444444"
                />
            </EffectComposerPmndrs>
        </Suspense>
    </TresCanvas>
</template>
