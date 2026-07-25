import { http } from '@/api/http.ts'

export type GroupType = 'public' | 'private'

export interface Group {
  group_id: string
  owner_id: string
  name: string
  description: string
  primary_subject: string
  subject_tags: string[]
  group_type: GroupType
  member_count: number
  created_at: string
}


export interface CreateGroupRequest {
  name: string
  description: string
  primary_subject: string
  subject_tags?: string[]
  group_type: GroupType
}

export type MemberRole = 'owner' | 'member'
export type MemberStatus = 'active' | 'pending'

export interface GroupMember {
  group_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  joined_at: string
}

export interface ListMembersResponse {
  members: GroupMember[]
  count: number
  is_owner: boolean
}

export interface TransferOwnershipRequest {
  new_owner_id: string
}

export async function getMyGroups(): Promise<Group[]> {
  const response = await http<{ groups: Group[] }>('/group/users/me', {
    method: 'GET',
  })
  return response.groups
}

export async function listGroups(params?: { subject?: string; cursor?: string; limit?: number }) {
  return await http<{ groups: Group[]; nextCursor: string | null; count: number }>(
    '/group/groups',
    { method: 'GET', query: params },
  )
}

export async function createGroup(payload: CreateGroupRequest): Promise<Group> {
  const { group_id } = await http<{ group_id: string }>('/group/groups', {
    method: 'POST',
    body: payload,
  })

  // backend only returns the new id — fetch the full record
  return await getGroup(group_id)
}

export async function getGroup(groupId: string): Promise<Group> {
  const response = await http<{ group: Group }>(`/group/groups/${groupId}`, {
    method: 'GET',
  })
  return response.group
}


export async function listMembers(groupId: string): Promise<ListMembersResponse> {
  return await http<ListMembersResponse>(`/members/${groupId}/members`, {
    method: 'GET',
  })
}

export async function joinGroup(groupId: string): Promise<void> {
  await http<void>(`/members/${groupId}/join`, { method: 'POST' })
}

export async function leaveGroup(groupId: string): Promise<void> {
  await http<void>(`/members/${groupId}/leave`, { method: 'DELETE' })
}

export async function approveMember(groupId: string, userId: string): Promise<void> {
  await http<void>(`/members/${groupId}/members/${userId}/approve`, { method: 'POST' })
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  await http<void>(`/members/${groupId}/members/${userId}/remove`, { method: 'DELETE' })
}

export async function transferOwnership(
  groupId: string,
  userId: string,
  payload: TransferOwnershipRequest,
): Promise<void> {
  await http<void>(`/members/${groupId}/members/${userId}/transfer-ownership`, {
    method: 'POST',
    body: payload,
  })
}
