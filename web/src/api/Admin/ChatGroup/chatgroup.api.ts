import { axiosClient } from "../axiosClient"

export const fetchChatGroups = async (param: string, search: string) => {
    const { data } = await axiosClient.get('/admin/chatgroups', { params: { cursor: param, search } })
    console.log(data, 'chatgroups')
    return data
}

export const removeChatGroup = async (groupId: string) => {
    const { data } = await axiosClient.post("/admin/chatgroup/remove", { groupId })
    console.log(data)
    return data
}
