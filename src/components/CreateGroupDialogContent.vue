<script setup lang="ts">
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ref } from 'vue'
import { createGroup, type GroupType } from '@/api/group.ts'
import { toast } from 'vue-sonner'

const emit = defineEmits(['created'])
const open = ref(false)
const name = ref('')
const description = ref('')
const primarySubject = ref('')
const groupType = ref<GroupType>('public')
const loading = ref(false)
const errors = ref<{ name?: string; subject?: string }>({})

async function submit() {
  errors.value = {}
  if (!name.value.trim()) errors.value.name = 'Group name is required'
  if (!primarySubject.value.trim()) errors.value.subject = 'Primary subject is required'
  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    const group = await createGroup({
      name: name.value.trim(),
      description: description.value.trim(),
      primary_subject: primarySubject.value.trim(),
      group_type: groupType.value,
    })

    emit('created', group)
    toast.success(`"${group.name}" created`)
    open.value = false
    name.value = ''
    description.value = ''
    primarySubject.value = ''
    groupType.value = 'public'
  } catch {
    // http.ts already toasts the error
  } finally {
    loading.value = false
  }
}
</script>

<template>
    <DialogHeader>
      <DialogTitle> Create Group </DialogTitle>

      <DialogDescription> Create a new community group. </DialogDescription>
    </DialogHeader>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label> Name </Label>

        <Input v-model="name" placeholder="Group name" aria-label="group-name" />
        <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
      </div>

      <div class="space-y-2">
        <Label> Description </Label>

        <Textarea
          v-model="description"
          placeholder="Describe your group"
          aria-label="description"
        />
      </div>

      <div class="space-y-2">
        <Label> Primary Subject </Label>

        <Input
          v-model="primarySubject"
          placeholder="e.g. Mathematics"
          aria-label="primary-subject"
        />
        <p v-if="errors.subject" class="text-sm text-destructive">{{ errors.subject }}</p>
      </div>

      <div class="space-y-2">
        <Label> Visibility </Label>
        <Select v-model="groupType">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter>
      <Button @click="submit" :disabled="loading">
        {{ loading ? 'Creating...' : 'Create' }}
      </Button>
    </DialogFooter>
</template>

<style scoped></style>
