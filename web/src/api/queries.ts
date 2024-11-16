import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';

export const useApiQuery = <T>(
  key: string[],
  url: string,
  options?: UseQueryOptions<T>
) => {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await axiosClient.get<T>(url);
      return data;
    },
    ...options,
  });
};

export const useApiMutation = <T, V>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: UseMutationOptions<T, Error, V>
) => {
  return useMutation<T, Error, V>({
    mutationFn: async (variables) => {
      const { data } = await axiosClient[method]<T>(url, variables);
      return data;
    },
    ...options,
  });
};

