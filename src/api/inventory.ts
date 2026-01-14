import request from '@/utils/http'
import type { InventoryItem, OutboundRecord, BatchImportResult } from '@/types'

/**
 * InboundDTO (对应 services.InboundDTO)
 */
export interface InboundDTO {
  batchNo: string
  inboundNo: string
  materialCode: string
  materialName: string
  category: string
  spec: string
  unit: string
  brand: string
  quantity: number
  expiryDate: string
  mode?: 'append' | 'overwrite'
}

/**
 * 领用申请DTO (对应 controllers.ApplyOutboundReq)
 */
export interface ApplyOutboundReq {
  inventory_id: number
  quantity: number
  purpose: string
}

/**
 * 获取库存列表
 * GET /api/v1/inventory
 */
export const getInventoryList = (params?: {
  page?: number
  page_size?: number
  material_name?: string
  code?: string
  batch_no?: string
  status?: number // 0:全部, 1:正常, 2:临期, 3:过期
}) => {
  return request.get<InventoryItem[]>('/api/v1/inventory', { params })
}

/**
 * 耗材入库 (批量/单条)
 * POST /api/v1/inventory/inbound
 * 注: 尽管 OAS schema 是单个对象，但描述说是批量，且前端习惯批量导入。
 * 如果后端只接受单个，这里需要循环调用或确认后端是否支持数组。
 * 暂时假设支持单个对象，如果需要批量，业务层循环调用。
 */
export const importInventory = (data: InboundDTO) => {
  return request.post('/api/v1/inventory/inbound', data)
}

/**
 * 批量导入Excel
 * POST /api/v1/inventory/import
 */
export const batchImportInventory = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<BatchImportResult>('/api/v1/inventory/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000, // 30s timeout
  })
}

/**
 * 领用申请
 * POST /api/v1/outbound/apply
 */
export const consumeInventory = (data: ApplyOutboundReq) => {
  return request.post('/api/v1/outbound/apply', data)
}

/**
 * 我的领用记录
 * GET /api/v1/outbound/my
 */
export const getOutboundList = (params?: { page?: number; page_size?: number }) => {
  return request.get<OutboundRecord[]>('/api/v1/outbound/my', { params })
}

/**
 * 更新领用状态 (标记已用完)
 * PUT /api/v1/outbound/{id}/status?status=FINISHED
 */
export const markOutboundFinished = (id: number) => {
  return request.put(`/api/v1/outbound/${id}/status`, null, {
    params: { status: 'FINISHED' },
  })
}

/**
 * 删除库存
 * DELETE /api/v1/inventory/{id}
 */
export const deleteInventory = (id: number) => {
  return request.delete(`/api/v1/inventory/${id}`)
}

/**
 * 获取统计数据 (前端计算，或保留此接口备用)
 * 暂无对应 API，保留但不导出，或注释掉
 */
// export const getDashboardStats = () => {
//   return request.get('/stats/dashboard')
// }
