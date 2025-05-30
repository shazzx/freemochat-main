import { axiosClient } from "../axiosClient"

export const fetchBookmarks = async (cursor: string) => {
    const { data } = await axiosClient.get('posts/bookmarks', {
        params: { cursor }
    })
    return data
}