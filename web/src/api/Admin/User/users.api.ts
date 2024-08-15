import { axiosClient } from "../axiosClient"

export const fetchUsers = async (param: string, search) => {
    const { data } = await axiosClient.get('/admin/users', { params: { cursor: param, search } })
    return data
}

export const removeUser = async (userId) => {
    const { data } = await axiosClient.post("/admin/user/remove", { userId })
    console.log(data)
    return data
}


export const suspendUser = async (userId) => {
    const { data } = await axiosClient.post("/admin/user/suspend", { userId })
    console.log(data)
    return data
}

