import type { DisplayProfile, Profile } from '@/api/profile.ts'
import type { UserPublicProfile } from '@/api/user.ts'

export function mapSelfProfile(p: Profile): DisplayProfile {
  return {
    userId: p.user_id,
    name: p.name,
    email: p.email,
    interests: p.interests,
    courses: p.courses,
    studyPreferences: p.study_preference ?? {},
    privacy: p.privacy,
    isOwn: true,
  }
}

export function mapPublicProfile(p: UserPublicProfile): DisplayProfile {
  return {
    userId: p.user_id,
    name: p.name,
    email: p.email,
    interests: p.interests ?? [],
    courses: p.courses,
    studyPreferences: p.studyPreferences ?? {},
    isOwn: false,
  }
}
