import { axiosClient } from "./axiosClient"

export const fetchReports = async (param: string, search: string) => {
    const { data } = await axiosClient.get('/admin/reports', { params: { cursor: param, search } })
    return data
}

export const removeReport = async (reportId: string) => {
    const { data } = await axiosClient.post("/admin/report/remove", { reportId })
    console.log(data)
    return data
}
