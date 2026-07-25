import { computed, ref, type Ref } from 'vue'
import { useProfileStore } from '@/stores/profile.ts'
import { getProfile } from '@/api/profile.ts'
import { getUsersProfile } from '@/api/user.ts'
import { mapPublicProfile, mapSelfProfile } from '@/utils/profileMappers.ts'

export function useProfile(userIdParam: Ref<string | undefined>) {
  const store = useProfileStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isOwn = computed(() => !userIdParam.value || userIdParam.value === store.selfProfile?.user_id)

  async function load() {
    loading.value = true
    error.value = null
    try {
      if (isOwn.value) {
        store.setSelfProfile(await getProfile())
      } else {
        store.setProfile(await getUsersProfile(userIdParam.value!))
      }
    } catch (e) {
      error.value = 'Failed to load user'
    } finally {
      loading.value = false
    }
  }

  const display = computed(() => {
    if (isOwn.value) {
      return store.selfProfile ? mapSelfProfile(store.selfProfile) : null
    }
    return store.profile ? mapPublicProfile(store.profile) : null
  })

  return { display, loading, error, isOwn, load }
}
