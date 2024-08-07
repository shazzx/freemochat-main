import { store } from '@/app/store';
import axios from 'axios'


const baseURL = "http://localhost:3000/api"


export const axiosClient = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

axiosClient.interceptors.request.use(
    (config) => {
        const access_token =  store.getState().auth.access_token
        if (access_token) {
            config.headers.Authorization = `Bearer ${access_token}`

        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)