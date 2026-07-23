<script lang="ts"></script>

<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useGroupStore } from '@/stores/group.ts'
import { onMounted } from 'vue'
import { getMyGroups } from '@/api/group.ts'
import CreateGroupDialog from '@/components/CreateGroupDialog.vue'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const groupStore = useGroupStore()

onMounted(async () => {
  const groups = await getMyGroups()

  groupStore.setGroups(groups)
})

function handleCreated(group: any) {
  groupStore.groups.push(group)

  groupStore.selectGroup(group)
}

function selectGroup(group: any) {
  groupStore.selectGroup(group)
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink href="#"> Building Your Application </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div class="space-y-6">
          <h1 class="text-3xl font-bold">Welcome</h1>

          <div>
            <h2 class="mb-3 text-xl font-semibold">Your Groups</h2>

            <div class="grid gap-4 md:grid-cols-3">
              <Card
                v-for="group in groupStore.groups"
                :key="group.id"
                class="cursor-pointer hover:bg-muted"
                @click="selectGroup(group)"
              >
                <CardHeader>
                  <CardTitle>
                    {{ group.name }}
                  </CardTitle>

                  <CardDescription>
                    {{ group.description }}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <CreateGroupDialog @created="handleCreated" />

          <div v-if="groupStore.currentGroup" class="rounded-xl border p-5">
            Current group:

            <strong>
              {{ groupStore.currentGroup.name }}
            </strong>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
