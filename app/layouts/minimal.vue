<template>
    <UMain class="flex min-h-dvh flex-col">
        <MotionConfig :transition="{ duration: 0.6 }" reduced-motion="user">
            <div class="mx-24 my-18 flex grow flex-col gap-12">
                <slot />
            </div>
        </MotionConfig>
    </UMain>
</template>
