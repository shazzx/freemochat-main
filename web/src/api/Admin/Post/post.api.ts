import { axiosClient } from "../axiosClient"

export const fetchPosts = async (param: string, search) => {
    const { data } = await axiosClient.get('/admin/posts', { params: { cursor: param, search } })
    return data
}

export const removePost = async (postDetails) => {
    const { data } = await axiosClient.post("/admin/post/remove", { postDetails })
    console.log(data)
    return data
}

