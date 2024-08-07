import { axiosClient } from "../axiosClient"

export const fetchBookmarks = async (cursor) => {
    const { data } = await axiosClient.get('posts/bookmarks', {
        params: { cursor }
    })
    console.log(data)
    return data
}