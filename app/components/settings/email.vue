<script setup lang="ts">
import { z } from 'zod'

interface Props {
    session: NonNullable<Session>
}
const props = defineProps<Props>()

const config = useRuntimeConfig()
const toast = useToast()

const newEmail = ref('')
const emailChangeEmailSent = ref(false)
const passwordResetEmailSent = ref(false)

const requestChangeEmail = async () => {
    emailChangeEmailSent.value = false

    const parseResult = z.email().safeParse(newEmail.value)
    if (!parseResult.success) {
        toast.add({
            icon: 'lucide:x',
            title: 'Invalid email',
            description: 'Please enter a valid email address.',
            color: 'error',
        })
        return
    }

    try {
        await authClient.changeEmail({
            newEmail: newEmail.value,
            callbackURL: `${config.public.adminDomain}/confirm-change-email`,
        })
        emailChangeEmailSent.value = true
        toast.add({
            icon: 'lucide:check',
            title: 'Email change email sent',
            description:
                'Check your inbox and click the link in the email to complete the email address change.',
            color: 'success',
        })
    } catch {
        toast.add({
            icon: 'lucide:x',
            title: 'Failed to send email',
            description: 'Please try again later.',
            color: 'error',
        })
    }
}

const requestPasswordReset = async () => {
    passwordResetEmailSent.value = false

    try {
        await authClient.requestPasswordReset({
            email: props.session.user.email,
            redirectTo: `${config.public.adminDomain}/reset-password`,
        })
        passwordResetEmailSent.value = true
        toast.add({
            icon: 'lucide:check',
            title: 'Password reset email sent',
            description: 'Check your inbox and click the link in the email to reset your password.',
            color: 'success',
        })
    } catch {
        toast.add({
            icon: 'lucide:x',
            title: 'Failed to send email',
            description: 'Please try again later.',
            color: 'error',
        })
    }
}

watch(passwordResetEmailSent, (value) => {
    if (value)
        setTimeout(() => {
            passwordResetEmailSent.value = false
        }, 5000)
})
</script>

<template>
    <UCard>
        <template #header>
            <div class="flex w-full items-center justify-between gap-2">
                <h2 class="my-2 text-xl leading-none font-semibold text-nowrap">Account</h2>

                <UBadge
                    v-if="props.session.user.emailVerified"
                    icon="lucide:check"
                    label="Email verified"
                    variant="soft"
                    color="success"
                />
            </div>
        </template>

        <div class="flex w-full flex-col gap-6">
            <UPageCard
                v-if="!props.session.user.emailVerified"
                title="Email verification"
                description="Verify your email address."
                orientation="horizontal"
                variant="naked"
            >
                <UButton
                    label="Resend verification email"
                    color="secondary"
                    variant="subtle"
                    block
                    class="ml-auto w-fit min-w-48"
                />
            </UPageCard>

            <UPageCard
                title="Change email"
                description="Change your email address."
                orientation="horizontal"
                variant="naked"
            >
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-end gap-1.5">
                        <UBadge label="Current" variant="soft" color="neutral" />
                        <span class="text-sm">{{ props.session.user.email }}</span>
                    </div>

                    <div class="flex items-center justify-end gap-1">
                        <UInput v-model="newEmail" placeholder="user@example.com" />
                        <UButton
                            label="Change"
                            variant="subtle"
                            color="neutral"
                            block
                            class="w-fit px-4"
                            @click="requestChangeEmail"
                        />
                    </div>
                </div>
            </UPageCard>

            <UPageCard
                title="Password reset"
                description="Send a password reset email to the registered email address."
                orientation="horizontal"
                variant="naked"
            >
                <UButton
                    :icon="passwordResetEmailSent ? 'lucide:check' : undefined"
                    :label="passwordResetEmailSent ? 'Email sent' : 'Password reset'"
                    :color="passwordResetEmailSent ? 'success' : 'neutral'"
                    variant="subtle"
                    block
                    loading-auto
                    :disabled="passwordResetEmailSent"
                    class="ml-auto w-fit min-w-48"
                    @click="requestPasswordReset"
                />
            </UPageCard>
        </div>
    </UCard>
</template>
