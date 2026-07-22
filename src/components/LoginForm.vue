<script setup lang="ts">
import { computed, type HTMLAttributes, reactive, ref } from 'vue'
import { cn } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth.ts'
import { useRoute, useRouter } from 'vue-router'
import { Spinner } from '@/components/ui/spinner'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const errorMessage = ref('')

const banner = computed(() => {
  if (route.query.registered) return 'Account created — please sign in.'
  if (route.query.reset) return 'Password updated — please sign in.'
  return null
})

const form = reactive({
  email: '',
  password: '',
})

const touched = reactive({
  email: false,
  password: false,
})

function isEmailValid() {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
}

function isPasswordValid() {
  return form.password.length >= 8
}

function isFormValid() {
  return isEmailValid() && isPasswordValid()
}

async function onSubmit() {
  errorMessage.value = ''

  if (!isFormValid()) {
    touched.email = true
    touched.password = true
    return
  }

  loading.value = true
  try {
    await auth.login({
      email: form.email,
      password: form.password,
    })
    router.push('/dashboard')
  } catch (error: any) {
    errorMessage.value =
      error.response?.status === 401 ? 'Invalid email or password' : 'Unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription> Enter your email below to login to your account </CardDescription>
      </CardHeader>
      <CardContent>
        <p v-if="banner" class="mb-4 text-sm text-center text-green-600">
          {{ banner }}
        </p>
        <form @submit.prevent="onSubmit">
          <FieldGroup>
            <Field>
              <FieldLabel for="email"> Email </FieldLabel>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="m@example.com"
                required
                @blur="touched.email = true"
                aria-label="email"
              />
              <FieldError v-if="touched.email && !isEmailValid()">
                Please enter a valid email address
              </FieldError>
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password"> Password </FieldLabel>
                <p class="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                  <RouterLink to="/forgot-password"> Forgot your password? </RouterLink>
                </p>
              </div>
              <Input
                id="password"
                v-model="form.password"
                type="password"
                required
                aria-label="Password"
                @blur="touched.password = true"
              />
              <FieldError v-if="touched.password && !isPasswordValid()">
                Password must be at least 8 characters long
              </FieldError>
            </Field>
            <Field>
              <FieldError v-if="errorMessage">
                {{ errorMessage }}
              </FieldError>
              <Button type="submit" :disabled="loading" class="disabled:opacity-60">
                <Spinner v-if="loading" class="animate-spin" />
                {{ loading ? 'Logging in...' : 'Login' }}
              </Button>
              <FieldDescription class="text-center">
                Don't have an account?
                <RouterLink to="/signup">Sign up</RouterLink>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
