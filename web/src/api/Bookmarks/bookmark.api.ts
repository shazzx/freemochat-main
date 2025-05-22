import { axiosClient } from "../axiosClient"

export const fetchBookmarks = async (cursor: string, postType: string) => {
    const { data } = await axiosClient.get('posts/bookmarks', {
        params: { cursor, postType }
    })
    return data
}