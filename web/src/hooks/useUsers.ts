import { useApiMutation, useApiQuery } from "@/api/queries";
import { TUser } from "@/utils/types/TUser";

export const useUsers = () => {
    return useApiQuery<User>(['user'], '/user');
  };
  
  export const useUser = (id: string) => {
    return useApiQuery<User>(['user', id], `/users/${id}`);
  };
  
  export const useCreateUser = () => {
    return useApiMutation<TUser, TUser>('/user/create');
  };
  
  export const useUpdateUser = () => {
    return useApiMutation<TUser, TUser>('/user/update', 'put');
  };