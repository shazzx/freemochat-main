import { axiosClient } from "../axiosClient"

export const fetchDashboardData = async () => {
    const { data } = await axiosClient.get('/admin/dashboardData')
    return data
}