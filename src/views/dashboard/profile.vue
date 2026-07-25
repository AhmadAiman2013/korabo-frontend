<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProfile } from '@/composables/useProfile'
import CourseManager from '@/components/CourseManager.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Lock, Pencil, X } from '@lucide/vue'
import { updateProfile } from '@/api/profile.ts'
import { toast } from 'vue-sonner'
import { Style, Avatar as DicebearAvatar } from '@dicebear/core'
import definition from '@dicebear/styles/glyphs.json' with { type: 'json' }
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator'

const route = useRoute()
const userId = computed(() => route.params.userId as string | undefined)
const { display, loading, error, isOwn, load } = useProfile(userId)

// ---- avatar / fallback name ----
const style = new Style(definition)
const avatarDice = computed(() => {
  const seed = display.value?.userId ?? 'user-seed'
  return new DicebearAvatar(style, { seed, size: 128 }).toDataUri()
})
function generateFallbackName() {
  const seed = display.value?.userId ?? 'user-seed'
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    style: 'capital',
    seed,
  })
}

// ---- privacy toggle ----
const showCourses = ref(display.value?.privacy?.show_courses ?? false)
watch(display, (d) => {
  showCourses.value = d?.privacy?.show_courses ?? false
})

async function handlePrivacyToggle(checked: boolean) {
  try {
    await updateProfile({ privacy: { show_courses: checked } })
    await load()
  } catch {
    showCourses.value = !checked
    toast.error('Failed to update privacy setting')
  }
}

// ---- inline edit mode ----
const isEditing = ref(false)
const saving = ref(false)
const nameInput = ref('')
const interestsText = ref('')
const preferredTime = ref('')
const preferredStyle = ref('')

function enterEditMode() {
  if (!display.value) return
  nameInput.value = display.value.name ?? ''
  interestsText.value = display.value.interests.join(', ')
  preferredTime.value = display.value.studyPreferences?.preferred_time ?? ''
  preferredStyle.value = display.value.studyPreferences?.preferred_style ?? ''
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function handleSave() {
  saving.value = true
  try {
    await updateProfile({
      name: nameInput.value.trim() || undefined,
      interest: interestsText.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      study_preferences: {
        preferred_time: preferredTime.value || undefined,
        preferred_style: preferredStyle.value || undefined,
      },
    })
    toast.success('Profile updated')
    isEditing.value = false
    await load()
  } catch {
    toast.error('Failed to update profile')
  } finally {
    saving.value = false
  }
}

onMounted(load)
watch(() => route.params.userId, load)
</script>

<template>
  <div class="mx-auto w-full max-w-4xl p-6 space-y-6">
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>

    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <template v-else-if="display">
      <!-- Identity card -->
      <Card>
        <CardContent class="flex flex-wrap items-center gap-6 p-6">
          <Avatar class="h-24 w-24 shrink-0">
            <AvatarImage :src="avatarDice" :alt="display.name ?? 'avatar'" />
            <AvatarFallback>{{
              (display.name ?? generateFallbackName()).slice(0, 2)
            }}</AvatarFallback>
          </Avatar>

          <div class="min-w-0 flex-1 space-y-1">
            <Input
              v-if="isEditing"
              v-model="nameInput"
              placeholder="Your name"
              class="h-9 max-w-sm text-lg font-semibold"
              aria-label="name"
            />
            <div v-else class="flex flex-wrap items-center gap-2">
              <h2 class="truncate text-2xl font-semibold">
                {{ display.name ?? generateFallbackName() }}
              </h2>
              <Badge v-if="display.isOwn" variant="secondary">You</Badge>
            </div>
            <p v-if="display.email" class="truncate text-sm text-muted-foreground">
              {{ display.email }}
            </p>
          </div>

          <div v-if="isOwn" class="flex shrink-0 gap-2">
            <Button v-if="!isEditing" variant="outline" size="sm" @click="enterEditMode">
              <Pencil class="h-4 w-4" />
              Edit
            </Button>
            <template v-else>
              <Button variant="ghost" size="sm" :disabled="saving" @click="cancelEdit">
                <X class="h-4 w-4" />
              </Button>
              <Button size="sm" :disabled="saving" @click="handleSave">
                {{ saving ? 'Saving…' : 'Save' }}
              </Button>
            </template>
          </div>
        </CardContent>
      </Card>

      <!-- Details card -->
      <Card>
        <CardContent class="space-y-8 p-6">
          <div class="grid gap-8 sm:grid-cols-2">
            <section>
              <h3 class="mb-3 text-sm font-medium text-muted-foreground">Interests</h3>
              <Input
                v-if="isEditing"
                v-model="interestsText"
                placeholder="e.g. algorithms, design, hiking"
                aria-label="interests"
              />
              <p v-if="isEditing" class="mt-1 text-xs text-muted-foreground">Comma-separated.</p>
              <div v-else-if="display.interests.length" class="flex flex-wrap gap-2">
                <Badge v-for="i in display.interests" :key="i" variant="outline">{{ i }}</Badge>
              </div>
              <p v-else class="text-sm text-muted-foreground">No interests added yet.</p>
            </section>

            <section>
              <h3 class="mb-3 text-sm font-medium text-muted-foreground">Study preferences</h3>
              <div v-if="isEditing" class="space-y-3">
                <Select v-model="preferredTime">
                  <SelectTrigger><SelectValue placeholder="Preferred time" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="preferredStyle">
                  <SelectTrigger><SelectValue placeholder="Preferred style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div
                v-else-if="
                  display.studyPreferences?.preferred_time ||
                  display.studyPreferences?.preferred_style
                "
                class="flex flex-wrap gap-2"
              >
                <Badge v-if="display.studyPreferences?.preferred_time" variant="outline">
                  {{ display.studyPreferences.preferred_time }}
                </Badge>
                <Badge v-if="display.studyPreferences?.preferred_style" variant="outline">
                  {{ display.studyPreferences.preferred_style }}
                </Badge>
              </div>
              <p v-else class="text-sm text-muted-foreground">No preferences set.</p>
            </section>
          </div>

          <section>
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-medium text-muted-foreground">Courses</h3>
              <div v-if="isOwn" class="flex items-center gap-2">
                <Label for="show-courses" class="text-xs text-muted-foreground"
                  >Visible to others</Label
                >
                <Switch
                  id="show-courses"
                  v-model:checked="showCourses"
                  @update:checked="handlePrivacyToggle"
                />
              </div>
            </div>
            <CourseManager
              v-if="display.courses !== undefined"
              :courses="display.courses"
              :editable="isOwn"
            />
            <p v-else class="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock class="h-4 w-4" />
              Courses are private.
            </p>
          </section>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
