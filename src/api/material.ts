import request from '@/utils/http'
import type { Material, ApiResponse, BatchImportResult } from '@/types'

/**
 * 创建物料请求DTO
 * 对应 API: POST /api/v1/materials
 */
export interface CreateMaterialDTO {
  code: string
  name: string
  category: string
  spec: string
  unit: string
  brand: string
  safety_stock?: number
  expiry_alert_days?: number
  opened_expiry_days?: number
}

/**
 * 获取物料列表
 * GET /api/v1/materials
 */
export const getMaterialList = (params?: {
  page?: number
  page_size?: number
  name?: string // 模糊搜索
}) => {
  return request.get<Material[]>('/api/v1/materials', { params })
}

/**
 * 创建物料
 * POST /api/v1/materials
 */
export const createMaterial = (data: CreateMaterialDTO) => {
  return request.post<ApiResponse<Material>>('/api/v1/materials', data)
}

/**
 * 批量导入Excel
 * POST /api/v1/materials/import
 */
export const batchImportMaterial = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<BatchImportResult>('/api/v1/materials/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000, // 30s timeout
  })
}

/**
 * 删除物料
 * DELETE /api/v1/materials/{id}
 */
export const deleteMaterial = (id: number) => {
  return request.delete(`/api/v1/materials/${id}`)
}
