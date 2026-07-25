<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from '@lucide/vue'
import { useCourses } from '@/composables/useCourses'
import { toast } from 'vue-sonner' // swap for your shadcn-vue toast setup

const props = defineProps<{
  courses: string[]
  editable: boolean
}>()

const { add, remove } = useCourses()
const newCourse = ref('')
const submitting = ref(false)

async function handleAdd() {
  const courseId = newCourse.value.trim()
  if (!courseId) return
  submitting.value = true
  try {
    await add(courseId)
    newCourse.value = ''
  } catch {
    toast.error('Failed to add course')
  } finally {
    submitting.value = false
  }
}

async function handleRemove(courseId: string) {
  try {
    await remove(courseId)
  } catch {
    toast.error('Failed to remove course')
  }
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="courses.length" class="flex flex-wrap gap-2">
      <Badge v-for="c in courses" :key="c" variant="secondary" class="gap-1 pr-1">
        {{ c }}
        <button
          v-if="editable"
          type="button"
          class="ml-1 rounded-full hover:bg-muted-foreground/20"
          @click="handleRemove(c)"
        >
          <X class="h-3 w-3" />
        </button>
      </Badge>
    </div>
    <p v-else class="text-sm text-muted-foreground">No courses added yet.</p>

    <div v-if="editable" class="flex gap-2">
      <Input v-model="newCourse" placeholder="e.g. CS 101" @keyup.enter="handleAdd" aria-label="New course"/>
      <Button :disabled="submitting || !newCourse.trim()" @click="handleAdd">
        <Plus class="h-4 w-4" />
        Add
      </Button>
    </div>
  </div>
</template>
