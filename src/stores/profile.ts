import { defineStore } from 'pinia';
import type { UserPublicProfile } from '@/api/user.ts'
import type { Profile } from '@/api/profile.ts'


export const useProfileStore = defineStore('profile', {
  state: () => ({
    selfProfile: null as Profile | null,
    profile: null as UserPublicProfile | null,
    profiles: {} as Record<string, UserPublicProfile>,
  }),
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
