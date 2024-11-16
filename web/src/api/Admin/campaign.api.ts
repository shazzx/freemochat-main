import { axiosClient } from "./axiosClient"

export const fetchCampaigns = async (param: string, search: string) => {
    const { data } = await axiosClient.get('/admin/campaigns', {params: {cursor: param, search}})
    return data
}

export const removeCampaign = async (campaignId: string) => {
    const { data } = await axiosClient.post("/admin/campaign/remove", { campaignId })
    console.log(data)
    return data
}
