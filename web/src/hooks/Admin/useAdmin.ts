import { fetchDashboardData } from "@/api/Admin/admin.api"
import { useQuery } from "@tanstack/react-query"

export const useDashboardData = () => {
    const { data, isLoading, isError, isFetched, isSuccess } = useQuery({
        queryKey: ['adminDashboardData'],
        queryFn: () => {
            return fetchDashboardData()
        },

    })
    console.log(data)

    return {
        data,
        isLoading,
        isError,
        isFetched,
        isSuccess,
    }
}
