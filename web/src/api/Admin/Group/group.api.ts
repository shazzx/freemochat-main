import { axiosClient } from "../axiosClient"

export const fetchGroups = async (param: string, search: string) => {
    const { data } = await axiosClient.get('/admin/groups', { params: { cursor: param, search } })
    console.log(data)
    return data
}

export const removeGroup = async (groupId: string) => {
    const { data } = await axiosClient.post("/admin/group/remove", { groupId })
    console.log(data)
    return data
}
