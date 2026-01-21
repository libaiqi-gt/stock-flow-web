import axios from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import { ElMessage } from 'element-plus'

// 定义返回数据的标准结构
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

class Request {
  private instance: AxiosInstance

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 在发送请求之前做些什么
        // 例如：添加 token
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: unknown) => {
        // 对请求错误做些什么
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 对响应数据做点什么
        const { code, msg } = response.data

        // 假设 200 为成功状态码，具体根据后端接口约定
        if (code === 200) {
          // 返回 data 部分，如果需要 code/msg 可以返回 response.data
          // 这里我们返回 response.data 以便获取完整信息 (如 code 用于判断)
          // 或者根据项目约定，直接返回 data.data
          return response.data as unknown as AxiosResponse
        } else {
          // 处理业务错误
          ElMessage.error(msg || '系统错误')
          return Promise.reject(new Error(msg || '系统错误'))
        }
      },
      (error: unknown) => {
        // 对响应错误做点什么
        let message = ''
        const err = error as AxiosError<ApiResponse>
        const status = err.response?.status
        const data = err.response?.data

        switch (status) {
          case 400:
            message = data?.msg || '请求参数错误'
            break
          case 401:
            message = '未授权，请登录'
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // 如果不是在登录页，则跳转
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }
            break
          case 403:
            message = '拒绝访问'
            break
          case 404:
            message = '请求地址出错'
            break
          case 500:
            message = '服务器内部错误'
            break
          default:
            message = err.message || '网络连接故障'
        }

        ElMessage.error(message)
        return Promise.reject(error)
      },
    )
  }

  // 封装常用方法
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, config) as Promise<ApiResponse<T>>
  }

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config) as Promise<ApiResponse<T>>
  }

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config) as Promise<ApiResponse<T>>
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config) as Promise<ApiResponse<T>>
  }
}

// 导出实例
const request = new Request({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 基础路径，可配置在 .env 文件中
  timeout: 10000, // 超时时间
})

export default request
