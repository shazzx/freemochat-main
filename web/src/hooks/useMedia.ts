import { fetchMedia } from "@/api/media.api";
import { useQuery } from "@tanstack/react-query";

export function useMedia(key: string, targetId: string): any {

    const { data, isLoading, isFetching, fetchStatus, isSuccess, error } = useQuery({
        queryKey: [key, targetId],
        queryFn: () => fetchMedia(targetId),
        staleTime: 0,
        enabled: !!targetId,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
    });

    return {
        data: data ?? [],
        isLoading,
        isSuccess,
        isFetching,
        error,
    };
}
