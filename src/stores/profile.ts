import { defineStore } from 'pinia';
import type { UserPublicProfile } from '@/api/user.ts'
import type { Profile } from '@/api/profile.ts'
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator'

function generateFallbackName(seed: string) {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    style: 'capital',
    seed,
  })
}

export const useProfileStore = defineStore('profile', {
  state: () => ({
    selfProfile: null as Profile | null,
    profile: null as UserPublicProfile | null,
    profiles: {} as Record<string, UserPublicProfile>,
  }),

  getters: {
    fallbackName: (state) => {
      return state.profile?.name || generateFallbackName(state.profile?.user_id || 'user-1')
    }
  },
  actions: {
    setSelfProfile(profile: Profile): void {
      this.selfProfile = profile
    },

    setProfile(profile: UserPublicProfile): void {
      this.profile = profile
    },

    setUserProfile(profile: UserPublicProfile): void {
      this.profiles[profile.user_id] = profile;
    },

    getUserProfile(userId: string) {
      return this.profiles[userId];
    }
  },

});
