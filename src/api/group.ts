import { http } from '@/api/http.ts'

export interface Group {
  id: string
  name: string
  description?: string
}

export interface CreateGroupRequest {
  name: string
  description?: string
}

export async function getMyGroups(): Promise<Group[]> {
  const response = await http('/group/users/me', {
    method: 'GET',
  })
  return response.data
}

export async function createGroup(payload: CreateGroupRequest): Promise<Group> {
  const response = await http('/group/groups', {
    method: 'POST',
    body: payload,
  })

  return response.data
}

export async function getGroup(groupId: string): Promise<Group> {
  const response = await http(`/group/groups/${groupId}`, {
    method: 'GET',
  })

  return response.data
}
