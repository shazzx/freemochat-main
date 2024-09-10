import { store } from '@/app/store';
import axios from 'axios'
import { toast } from 'react-toastify';


// const baseURL = "https://ec2-54-164-199-173.compute-1.amazonaws.com:3001/api"
// const baseURL = "https://b3a6-2402-ad80-111-33f9-e686-9df4-32a6-9d.ngrok-free.app/api"
// const baseURL = 'http://ec2-15-206-203-226.ap-south-1.compute.amazonaws.com:3000/api'
const baseURL = process.env.ENV == 'PRODUCTION' ? 'http://ec2-15-206-203-226.ap-south-1.compute.amazonaws.com:3000/api' : 'http://localhost:3000/api'



export const axiosClient = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

axiosClient.interceptors.request.use(
    (config) => {
        const access_token = store.getState().auth.access_token
        console.log(access_token, "access_token")
        if (access_token) {
            config.headers.Authorization = `Bearer ${access_token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)