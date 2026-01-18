import axios, { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import log from "loglevel";
import {toast} from "@/hooks/use-toast.ts";

const env = import.meta.env.VITE_ENV || "dev";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000,
    withCredentials:true
});

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {

        // Ensure headers is always an AxiosHeaders instance
        if (!config.headers) {
            config.headers = new AxiosHeaders();
        }

        // Only set JSON Content-Type if body is not FormData
        if (!(config.data instanceof FormData)) {
            config.headers.set('Content-Type', 'application/json');
        }

        config.withCredentials = true ;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if(env.startsWith("dev")){
            log.error("API ERROR", error);
        }
        toast({
            title: error.response.data?.title || (error.status === 500 ? "Error" : "Bad Request"),
            description: error.response.data?.message || "Failed to send reset email",
            variant: "destructive",
        });
        return Promise.reject(error)
    }

)

export default apiClient;