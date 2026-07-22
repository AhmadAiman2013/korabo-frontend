<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquareText, BookOpen, Zap, ArrowRight } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.ts'

const features = [
  {
    icon: MessageSquareText,
    title: 'Discussion Forums',
    description: 'Organized threads for every topic, with real-time replies and no clutter.',
    bg: 'bg-blue-500/10',
    fg: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Users,
    title: 'Study Groups',
    description: 'Form or join groups, coordinate sessions, and keep everyone in sync.',
    bg: 'bg-violet-500/10',
    fg: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: BookOpen,
    title: 'Shared Resources',
    description: 'Upload notes and materials, accessible instantly to your group.',
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Zap,
    title: 'Built for Speed',
    description:
      'Serverless architecture means it stays fast, whether 10 or 10,000 people show up.',
    bg: 'bg-amber-500/10',
    fg: 'text-amber-600 dark:text-amber-400',
  },
]

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Nav -->
    <header class="border-b">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div class="flex items-center gap-6">
          <span class="text-2xl font-semibold tracking-tight">Korabo</span>
          <div class="hidden h-5 w-px bg-border sm:block" />
          <nav class="hidden sm:flex">
            <a
              href="#features"
              class="text-xl font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Features
            </a>
          </nav>
          <RouterLink
            v-if="auth.isAuthenticated"
            to="/dashboard"
            class="text-lg font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Dashboard
          </RouterLink>
        </div>
        <div class="flex items-center gap-3">
          <Button variant="ghost" as-child>
            <RouterLink to="/login"><span class="text-lg">Log In</span></RouterLink>
          </Button>
          <Button as-child>
            <RouterLink to="/login"><span class="text-lg">Get Started</span></RouterLink>
          </Button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
      <h1 class="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        Study together.
        <span class="block text-muted-foreground">Build something real.</span>
      </h1>
      <p class="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        Korabo is a forum and study-group platform for people who'd rather learn out loud than
        alone. Ask questions, share notes, and keep momentum going.
      </p>
      <div class="mt-10 flex items-center justify-center gap-4">
        <Button size="lg" as-child>
          <RouterLink to="/login">
            Get started
            <ArrowRight class="ml-1 h-4 w-4" />
          </RouterLink>
        </Button>
        <Button size="lg" variant="outline" as-child>
          <a href="#features">Learn more</a>
        </Button>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="border-t bg-muted/30">
      <div class="mx-auto max-w-6xl px-6 py-20">
        <div class="mb-12 text-center">
          <span
            class="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            Features
          </span>
          <h2 class="text-3xl font-bold tracking-tight">Everything you need</h2>
          <p class="mt-2 text-muted-foreground">
            No bloat, no ads, just the tools that actually help you learn.
          </p>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card v-for="feature in features" :key="feature.title" class="border-none shadow-sm">
            <CardHeader>
              <div
                class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
                :class="feature.bg"
              >
                <component :is="feature.icon" class="h-5 w-5" :class="feature.fg" />
              </div>
              <CardTitle class="text-base">{{ feature.title }}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{{ feature.description }}</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="mx-auto max-w-6xl px-6 py-24 text-center">
      <h2 class="text-3xl font-bold tracking-tight">Ready to jump in?</h2>
      <p class="mx-auto mt-3 max-w-md text-muted-foreground">
        Create your first study group in under a minute. It's free to start.
      </p>
      <Button size="lg" class="mt-8" as-child>
        <RouterLink to="/signup">
          Create your account
          <ArrowRight class="ml-1 h-4 w-4" />
        </RouterLink>
      </Button>
    </section>

    <!-- Footer -->
    <footer class="border-t">
      <div class="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
        © {{ new Date().getFullYear() }} Korabo. Built with Vue.
      </div>
    </footer>
  </div>
</template>

<style scoped></style>
