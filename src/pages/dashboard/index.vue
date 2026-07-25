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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModeToggle from '@/components/ModeToggle.vue'

const route = useRoute()
const router = useRouter()

const breadcrumbs = computed(() => {
  return route.matched
    .filter((r) => r.meta.breads)
    .flatMap((r) => {
      const result = typeof r.meta.breads === 'function' ? r.meta.breads(route) : r.meta.breads

      // Normalize to an array of { title, path }
      const items = Array.isArray(result) ? result : [{ title: result, to: { name: r.name } }]

      return items.map((item) => ({
        title: item.title,
        path: item.to ? router.resolve(item.to).path : r.path,
      }))
    })
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 justify-between items-center px-4 shrink-0 gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <template v-for="(crumb, i) in breadcrumbs" :key="crumb.path">
                <BreadcrumbItem class="hidden md:block">
                  <BreadcrumbPage v-if="i === breadcrumbs.length - 1">
                    {{ crumb.title }}
                  </BreadcrumbPage>

                  <BreadcrumbLink v-else as-child>
                    <RouterLink :to="crumb.path">
                      {{ crumb.title }}
                    </RouterLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator v-if="i < breadcrumbs.length - 1" class="hidden md:block" />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <ModeToggle />
      </header>
      <RouterView />
    </SidebarInset>
  </SidebarProvider>
</template>
