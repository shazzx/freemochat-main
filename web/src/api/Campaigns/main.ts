import { axiosClient } from "../axiosClient"

export const fetchCampaignsData = async (pageParam, reverse) => {
    const { data } = await axiosClient.get("posts/promotions", {
        params: { cursor: pageParam, reverse }
    })
    return data
}

export const campaignActivationToggle = async (postId: string) => {
    const { data } = await axiosClient.post("posts/promotion/activationToggle", { postId })
    return data
}