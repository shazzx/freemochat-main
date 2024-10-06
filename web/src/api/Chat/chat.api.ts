import { axiosClient } from "../axiosClient"

export const fetchChatlist = async () => {
    const { data } = await axiosClient.get("chatlist")
    return data
}


export const fetchChatGroups = async () => {
    const { data } = await axiosClient.get("chatgroups")
    return data
}

export const fetchChatGroup = async (groupId: string) => {
    const { data } = await axiosClient.get("chatgroups/group?id=" + groupId)
    return data
}


export const createChatGroup = async (formData) => {
    const { data } = await axiosClient.post("/chatgroups/create", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20000 })
    return data
}

export const updateChatGroup = async (formData) => {
    const { data } = await axiosClient.post("/chatgroups/update", formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    // console.log(data)
}

export const fetchMessages = async (pageParam: Date, recepientId: string, isChatGroup: number) => {
    const { data } = await axiosClient.get("/messages", { params: { cursor: pageParam, recepientId, isChatGroup } })
    // console.log(data)
    return data
}

export const createMessage = async (formData: FormData) => {
    const { data } = await axiosClient.post("/messages/create", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20000 })
    return data
}