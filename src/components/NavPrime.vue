<script setup lang="ts">
import { type Component, ref } from 'vue'

import { CirclePlus } from '@lucide/vue'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useRoute } from 'vue-router'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import CreateGroupDialogContent from '@/components/CreateGroupDialogContent.vue'

interface NavItem {
  title: string
  name: string
  icon?: Component
  url: string
}

defineProps<{
  items: NavItem[]
}>()

const route = useRoute()
const open = ref(false)
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent class="flex flex-col gap-2">
      <SidebarMenu>
        <SidebarMenuItem class="flex items-center gap-2">
          <Dialog v-model:open="open">
            <DialogTrigger as-child>
              <SidebarMenuButton
                tooltip="Quick Create"
                class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <CirclePlus />
                <span>Create Group</span>
              </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent>
              <CreateGroupDialogContent />
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in items" :key="item.title">
          <SidebarMenuButton
            asChild
            :tooltip="item.title"
            :is-active="route.matched.some((r) => r.name === item.name)"
          >
            <RouterLink :to="{ path: item.url }">
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
