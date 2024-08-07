import { axiosClient } from "../axiosClient"

export const followPage = async (pageDetails) => {
    console.log(pageDetails)
    const { data } = await axiosClient.post("/page/follow", pageDetails)
    console.log(data)
}


export const fetchPage = async (handle) => {
    const { data } = await axiosClient.get('page?handle=' + handle)
    console.log(data)
    return data
}

export const createPage = async (formData) => {
    const { data } = await axiosClient.post("/page/create", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20000 })
    return data
}


export const updatePage = async (formData) => {
    const { data } = await axiosClient.post("/page/update", formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 20000 })
    console.log(formData)
}


export const removePage = async (pageDetails) => {
    console.log(pageDetails)
    const { data } = await axiosClient.post("/page/delete", { pageDetails },)
}

export const fetchPages = async () => {
    const { data } = await axiosClient.get('page/all')
    return data?.map((page) => {
        return {
            _id: page._id,
            name: page.name,
            images: page.images,
            handle: page?.handle,
            about: page.about,
        }
    })
}

export const fetchPageFollowers = async (cursor, pageId) => {
    console.log(pageId)
    const { data } = await axiosClient.get('followers', {
        params: { cursor, targetId: pageId, type: 'page' }
    })
    console.log(data)
    return data
}