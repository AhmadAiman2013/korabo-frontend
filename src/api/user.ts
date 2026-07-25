import type { StudyPreferences } from '@/api/profile.ts'
import { http } from '@/api/http.ts'

export interface UserPublicProfile {
  user_id: string
  name: string | null,
  email?: string,
  interests?: string[],
  courses?: string[],
  studyPreferences: StudyPreferences | null
}

export async function getUsersProfile(userId: string): Promise<UserPublicProfile> {
  return await http(`user/user/${userId}`, {
    method: 'GET'
  })
}


