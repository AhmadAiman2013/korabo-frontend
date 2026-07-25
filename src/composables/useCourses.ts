import { addCourse, removeCourse } from '@/api/profile.ts'
import { useProfileStore } from '@/stores/profile.ts'

export function useCourses() {
  const store = useProfileStore()

  async function add(courseId: string) {
    await addCourse(courseId)
    if (store.selfProfile) {
      store.selfProfile.courses = [...(store.selfProfile.courses ?? []), courseId]
    }
  }

  async function remove(courseId: string) {
    await removeCourse(courseId)
    if (store.selfProfile?.courses) {
      store.selfProfile.courses = store.selfProfile.courses.filter((c) => c !== courseId)
    }
  }

  return { add, remove }
}
