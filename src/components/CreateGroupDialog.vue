<script setup lang="ts">
import { ref } from 'vue'
import { createGroup } from '@/api/group.ts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const emit = defineEmits(['created'])

const open = ref(false)

const name = ref('')
const description = ref('')

const loading = ref(false)

async function submit() {
  if (!name.value) return

  loading.value = true

  try {
    const group = await createGroup({
      name: name.value,
      description: description.value,
    })

    emit('created', group)

    open.value = false

    name.value = ''
    description.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button> Create Group </Button>
    </DialogTrigger>

    <DialogContent>
      <DialogHeader>
        <DialogTitle> Create Group </DialogTitle>

        <DialogDescription> Create a new community group. </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label> Name </Label>

          <Input v-model="name" placeholder="Group name" aria-label="group-name" />
        </div>

        <div class="space-y-2">
          <Label> Description </Label>

          <Textarea
            v-model="description"
            placeholder="Describe your group"
            aria-label="description"
          />
        </div>
      </div>

      <DialogFooter>
        <Button @click="submit" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
