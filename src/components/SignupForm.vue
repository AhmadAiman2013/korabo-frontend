<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useRegistrationFlowStore } from '@/stores/registrationFlow.ts'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth.ts'
import { Spinner } from '@/components/ui/spinner'

const router = useRouter()
const store = useRegistrationFlowStore()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'passwords do not match'
    return
  }
  if (password.value.length < 8) {
    error.value = 'password must be at least 8 characters'
    return
  }

  loading.value = true
  try {
    const data = await auth.totp_setup({ email: email.value })
    store.setSetup(email.value, data.otpauth_url)
    router.push('/register/verify')
  } catch (e: any) {
    error.value = e?.response?.data?.status ?? 'something went wrong, try again'
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Create an account</CardTitle>
      <CardDescription> Enter your information below to create your account </CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="onSubmit">
        <FieldGroup>
          <Field>
            <FieldLabel for="email"> Email </FieldLabel>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="m@example.com"
              required
              aria-label="email"
            />
            <FieldDescription>
              We'll use this to contact you. We will not share your email with anyone else.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel for="password"> Password </FieldLabel>
            <Input
              id="password"
              v-model="password"
              type="password"
              required
              aria-label="password"
              minlength="8"
            />
            <FieldDescription>Must be at least 8 characters long.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel for="confirm-password"> Confirm Password </FieldLabel>
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              aria-label="confirm password"
            />
            <FieldDescription>Please confirm your password.</FieldDescription>
          </Field>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <FieldGroup>
            <Field>
              <Button type="submit" :disabled="loading" class="disabled:opacity-60">
                <Spinner v-if="loading" class="animate-spin" />
                {{ loading ? 'Continuing…' : 'Create Account' }}</Button
              >
              <FieldDescription class="px-6 text-center">
                Already have an account? <router-link to="/login">Sign in</router-link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldGroup>
      </form>
    </CardContent>
  </Card>
</template>
