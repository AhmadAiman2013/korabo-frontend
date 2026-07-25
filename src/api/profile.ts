import { http } from '@/api/http.ts'

export interface StudyPreferences {
  preferred_time?: string
  preferred_style?: string
}

export interface PrivacySettings {
  show_courses: boolean
}

export interface Profile {
  user_id: string
  email: string
  name: string | null
  courses?: string[]
  interest: string[]
  study_preference: StudyPreferences
  privacy: PrivacySettings
}

export async function getProfile(): Promise<Profile> {
  return await http('/user/user', {
    method: 'GET',
  })
}
