import http from '@/utils/http'
import type { ApiResponse, ApplyOutboundReq, AuditOutboundReq, OutboundItem } from '@/types'

/**
 * 提交领用申请
 */
export const applyOutbound = (data: ApplyOutboundReq) => {
  return http.post<ApiResponse<null>>('/api/v1/outbound/apply', data)
}

/**
 * 获取我的领用记录
 */
export const getMyOutbound = (params: { page: number; page_size: number }) => {
  return http.get<ApiResponse<{ list: OutboundItem[]; total: number }>>('/api/v1/outbound/my', {
    params,
  })
}

/**
 * 获取所有领用记录
 */
export const getAllOutboundList = (params: { page: number; page_size: number }) => {
  return http.get<ApiResponse<{ list: OutboundItem[]; total: number }>>('/api/v1/outbound/all', {
    params,
  })
}

/**
 * 获取待审批列表 (管理员)
 * 猜测接口: GET /api/v1/outbound/audit 或 /api/v1/outbound/list
 * 这里暂时使用 /api/v1/outbound/audit 并假设它支持 GET
 */
export const getAuditList = (params: {
  page: number
  page_size: number
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}) => {
  return http.get<ApiResponse<{ list: OutboundItem[]; total: number }>>(
    '/api/v1/outbound/audit/list',
    {
      params,
    },
  )
}

/**
 * 审批领用申请
 */
export const auditOutbound = (data: AuditOutboundReq) => {
  return http.post<ApiResponse<null>>('/api/v1/outbound/audit', data)
}
