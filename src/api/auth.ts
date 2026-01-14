import request from '@/utils/http'

/**
 * 登录请求参数
 */
export interface LoginReq {
  username: string
  password: string
}

/**
 * 登录响应数据
 * 假设后端返回结构: { token: string, user: User }
 * 如果不包含 user，则需要额外调用 /auth/me (但在当前文档中未找到)
 */
export interface LoginRes {
  token: string
  role: string
  username: string
}

/**
 * 用户登录
 * POST /auth/login
 */
export const loginApi = (data: LoginReq) => {
  return request.post<LoginRes>('/auth/login', data)
}

/**
 * 注册 (可选)
 * POST /auth/register
 */
export const registerApi = (data: LoginReq) => {
  return request.post<LoginRes>('/auth/register', data)
}
