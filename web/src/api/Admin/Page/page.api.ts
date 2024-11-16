import { axiosClient } from "../axiosClient"

export const fetchPages = async (param: string, search: string) => {
    const { data } = await axiosClient.get('/admin/pages', {params: {cursor: param, search}})
    console.log(data)
    return data
}

export const removePage = async (pageId: string) => {
    const { data } = await axiosClient.post("/admin/page/remove", { pageId })
    console.log(data)
    return data
}
