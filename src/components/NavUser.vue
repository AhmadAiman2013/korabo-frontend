<script setup lang="ts">
import { BadgeCheck, Bell, ChevronsUpDown, LogOut } from '@lucide/vue'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth.ts'
import router from '@/router'
import { Style, Avatar as DicebearAvatar } from '@dicebear/core'
import definition from '@dicebear/styles/glyphs.json' with { type: 'json' }
import { computed, onMounted, ref } from 'vue'
import { useProfileStore } from '@/stores/profile.ts'
import { getProfile } from '@/api/profile.ts'
import { Skeleton } from '@/components/ui/skeleton'
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator'

const props = withDefaults(
  defineProps<{
    seed?: string
  }>(),
  {
    seed: 'User',
  },
)

const { isMobile } = useSidebar()

const auth = useAuthStore()
const profileStore = useProfileStore()
const loading = ref<boolean>(true)

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

const style = new Style(definition)

const avatarDice = computed(() => {
  const userSeed = profileStore.selfProfile?.user_id || props.seed
  return new DicebearAvatar(style, {
    seed: userSeed,
    size: 128,
  }).toDataUri()
})

function generateFallbackName(seed: string) {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    style: 'capital',
    seed,
  })
}

const displayName = computed(() => {
  return (
    profileStore.selfProfile?.name ??
    generateFallbackName(profileStore.selfProfile?.user_id || props.seed)
  )
})

onMounted(async () => {
  try {
    const profile = await getProfile()
    profileStore.setSelfProfile(profile)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="size-8 rounded-lg">
              <template v-if="loading">
                <Skeleton class="size-8 rounded-lg" />
              </template>
              <template v-else>
                <AvatarImage :src="avatarDice" :alt="profileStore.selfProfile?.name" />
                <AvatarFallback>CN</AvatarFallback>
              </template>
            </Avatar>

            <div class="grid flex-1 text-left text-sm leading-tight">
              <template v-if="loading">
                <Skeleton class="h-4 w-24 mb-1" />
                <Skeleton class="h-3 w-36" />
              </template>
              <template v-else>
                <span class="truncate font-medium py-0.5">{{ displayName }}</span>
                <span class="truncate text-xs">{{ profileStore.selfProfile?.email }}</span>
              </template>
            </div>

            <template v-if="loading">
              <Skeleton class="size-4 rounded" />
            </template>
            <template v-else>
              <ChevronsUpDown class="ml-auto size-4" />
            </template>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage :src="avatarDice" :alt="profileStore.selfProfile?.name" />
                <AvatarFallback class="rounded-lg"> CN </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold py-0.5">{{ displayName }}</span>
                <span class="truncate text-xs">{{ profileStore.selfProfile?.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <RouterLink to="/dashboard/profile">
                <BadgeCheck />
                <span>Account</span>
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @select="handleLogout">
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
