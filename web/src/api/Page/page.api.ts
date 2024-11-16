import { axiosClient} from "@/api/axiosClient"
import { HTTP_CONTENT_TYPES } from "@/utils/enums/global.c"
import { PAGE_ROUTES } from "@/utils/enums/routes/page.routes.e"
import { GenericFormData } from "axios"

export const fetchPage = async (handle: string) => {
    const { data } = await axiosClient.get(PAGE_ROUTES.GET.replace(":handle", handle))
    console.log(data, 'page')
    return data
}

export const fetchPages = async () => {
    const { data } = await axiosClient.get(PAGE_ROUTES.ALL_PAGES)
    return data
}

export const createPage = async (formData: GenericFormData) => {
    const { data } = await axiosClient.post(PAGE_ROUTES.CREATE, formData, { headers: { 'Content-Type': HTTP_CONTENT_TYPES.MULTIPART_FORM_DATA } })
    return data
}

export const updatePage = async (formData: GenericFormData) => {
    const { data } = await axiosClient.post(PAGE_ROUTES.UPDATE, formData, { headers: { 'Content-Type': HTTP_CONTENT_TYPES.MULTIPART_FORM_DATA } })
    return data
}

export const removePage = async (pageDetails: {pageId: string, images: string[]}) => {
    const { data } = await axiosClient.post(PAGE_ROUTES.DELETE, { pageDetails })
    return data
}

export const followPage = async (pageDetails: {pageId: string, authorId: string}) => {
    console.log(pageDetails)
    const { data } = await axiosClient.post(PAGE_ROUTES.FOLLOW, {pageDetails})
    return data
}

export const fetchPageFollowers = async (cursor: any, pageId: string) => {
    const { data } = await axiosClient.get(PAGE_ROUTES.FOLLOWERS, {
        params: { cursor, targetId: pageId, type: 'page' }
    })
    return data
}