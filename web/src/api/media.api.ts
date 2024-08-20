import { axiosClient } from "./axiosClient"

export const fetchMedia = async (targetId: string) => {
    let { data } = await axiosClient.get("media", { params: { targetId } })
    return data
}