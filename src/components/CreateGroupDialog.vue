<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog, DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import CreateGroupDialogContent from '@/components/CreateGroupDialogContent.vue'

const open = ref(false)

</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button> Create Group </Button>
    </DialogTrigger>

    <DialogContent>
      <CreateGroupDialogContent />
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
