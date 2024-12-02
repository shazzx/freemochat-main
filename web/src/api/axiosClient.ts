import { store } from '@/app/store';
import { getToken } from '@/utils/getToken';
import axios from 'axios'

// const baseURL = "https://ec2-54-164-199-173.compute-1.amazonaws.com:3001/api"
// const baseURL = "https://b3a6-2402-ad80-111-33f9-e686-9df4-32a6-9d.ngrok-free.app/api"
// const baseURL = 'http://ec2-15-206-203-226.ap-south-1.compute.amazonaws.com:3000/api'

const baseURL = import.meta.env.VITE_ENV == 'PRODUCTION' ? import.meta.env.VITE_APP_BASE_URL_PROD : import.meta.env.VITE_APP_BASE_URL_DEV

export const axiosClient = axios.create({
    baseURL: baseURL + "/api",
    withCredentials: true,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})



axiosClient.interceptors.request.use(
    (config) => {
        const accessToken = getToken()
        config.headers.Authorization = `Bearer ${accessToken}`
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)