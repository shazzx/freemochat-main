import { axiosClient } from "../axiosClient"

export const joinGroup = async (groupData: {groupDetails: {groupId: string, userId?: string}}) => {
    console.log(groupData)
    const { data } = await axiosClient.post("/groups/join", groupData)
    console.log(data)
}


export const toggleJoinGroup = async (groupData: {groupDetails: {groupId: string, userId?: string}}) => {
    console.log(groupData)
    const { data } = await axiosClient.post("/members/join", groupData)
    console.log(data)
}


export const toggleGroupAdmin = async ({userId, groupId, isChatGroup}: {userId: string, groupId: string, isChatGroup?: boolean}) => {
    console.log(userId, groupId, isChatGroup)
    const { data } = await axiosClient.post("/members/toggleAdmin", {userId, groupId, isChatGroup})
    console.log(data)
}

export const fetchGroup = async (handle) => {
    const { data } = await axiosClient.get('groups?handle=' + handle)
    return data
}


export const fetchGroups = async () => {
    const { data } = await axiosClient.get('groups/all')
    console.log(data)
    return data?.map((group) => {
        return {
            _id: group._id,
            name: group.name,
            images: group.images,
            handle: group?.handle,
            description: group.description,
        }
    })
}


export const createGroup = async (formData) => {
    const { data } = await axiosClient.post("/groups/create", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20000 })
    return data
}


export const updateGroup = async (formData) => {
    const { data } = await axiosClient.post("/groups/update", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20000 })
    console.log(data)
}


export const removeGroup = async (groupDetails) => {
    const { data } = await axiosClient.post("/groups/delete", { groupDetails },)
}


export const fetchGroupMembers = async (cursor, groupId) => {
    const { data } = await axiosClient.get('members', {
        params: { cursor, groupId }
    })
    console.log(data)
    return data
}
