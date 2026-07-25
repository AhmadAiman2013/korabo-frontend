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
  interests: string[]
  study_preference: StudyPreferences | null
  privacy: PrivacySettings
}

export interface DisplayProfile {
  userId: string
  name: string | null
  email?: string
  interests: string[]
  courses?: string[] // undefined = private, [] = public+empty
  studyPreferences: StudyPreferences | null
  privacy?: PrivacySettings
  isOwn: boolean
}

export interface UpdateProfileRequest {
  name?: string
  interest?: string[]
  study_preferences?: StudyPreferences
  privacy?: PrivacySettings
}

export async function getProfile(): Promise<Profile> {
  return await http('/user/user', {
    method: 'GET',
  })
}

export async function updateProfile(payload: UpdateProfileRequest): Promise<void> {
  await http('/user/user', { method: 'POST', body: payload })
}

export async function addCourse(courseId: string): Promise<{ code: string; course_id: string }> {
  return await http('/user/user/courses', { method: 'POST', body: { course_id: courseId } })
}

export async function removeCourse(courseId: string): Promise<void> {
  await http(`/user/user/courses/${courseId}`, { method: 'DELETE' })
}

