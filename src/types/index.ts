// 响应接口定义
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/**
 * 用户信息模型
 */
export interface User {
  /** 用户ID */
  id?: number
  /** 用户名 */
  username: string
  /** 真实姓名 */
  real_name?: string
  /** 角色: Admin | Keeper | User */
  role: string
  /** 状态 */
  status?: 'active' | 'disabled'
}

/**
 * 领用申请请求参数
 */
export interface ApplyOutboundReq {
  inventory_id: number
  opening_date: string // YYYY-MM-DD
  purpose: string
  quantity: number
  remarks?: string
}

/**
 * 审批请求参数
 */
export interface AuditOutboundReq {
  id: number
  approved: boolean
  opinion?: string
}

/**
 * 领出记录/审批列表项模型
 * 对应 API 返回的完整结构
 */
export interface OutboundItem {
  id: number
  outbound_no: string
  inventory_id: number
  inventory?: InventoryItem
  user_id: number
  user?: {
    id: number
    username: string
    real_name: string
    role: string
    status: number
  }
  quantity: number
  purpose: string
  status: 'USING' | 'FINISHED'
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approval_opinion?: string
  approver_id?: number | null
  approver?: {
    id: number
    username: string
    real_name: string
  } | null
  approval_time?: string | null
  opening_date: string
  remarks: string
  snap_expiry_date: string
  apply_date: string
  created_at: string
  updated_at: string

  // 兼容旧字段，如果前端逻辑依赖这些字段，可以在处理数据时转换
  material_name?: string
  material_code?: string
  spec?: string
  unit?: string
  batch_no?: string
  applicant_name?: string
}

/**
 * 物料/产品模型
 * 对应 API 中的 Material
 */
export interface Material {
  id: number
  code: string
  name: string
  category: string
  spec: string
  unit: string
  brand: string
  /** 安全库存 */
  safety_stock?: number
  /** 效期报警时限(天) */
  expiry_alert_days?: number
  /** 开封后有效期(天) */
  open_expiry_days?: number
  created_at: string
  updated_at: string
}

/**
 * 兼容旧代码的 Product 别名 (建议逐渐迁移到 Material)
 */
export type Product = Material

/**
 * 库存项模型
 * 对应 API 返回的 JSON 结构
 */
export interface InventoryItem {
  id: number
  material_id: number
  material: Material
  batch_no: string
  inbound_no: string
  initial_qty: number
  current_qty: number
  expiry_date: string
  created_at: string
  updated_at: string
}

/**
 * 领出记录模型
 * 对应 API 中的 Outbound 相关接口
 */
export interface OutboundRecord {
  /** 主键 ID */
  id: number
  /** 关联的库存ID */
  inventoryId?: number
  /** 领出单号 (LC+YYYYMMDD+流水号) */
  outNo: string
  /** 物料编码 */
  code: string
  /** 物料名称 */
  name: string
  /** 规格 */
  spec: string
  /** 单位 */
  unit: string
  /** 品牌 */
  brand: string
  /** 领用数量 - API: quantity */
  quantity: number
  /** 领用人姓名 */
  user: string
  /** 领用用途 */
  purpose: string
  /** 状态: 使用中 | 已用完 */
  status: '使用中' | '已用完'
  /** 领出日期 */
  outDate: string
}

/**
 * 批量导入结果
 */
export interface BatchImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

/**
 * 仪表盘统计数据模型
 */
export interface DashboardStats {
  totalItems: number
  warningItems: number
  expiredItems: number
  trend: UsageTrend[]
}

export interface UsageTrend {
  label: string
  value: number
  color: string
}

/**
 * 效期状态模型
 */
export interface ExpiryStatus {
  status: 'normal' | 'warning' | 'expired'
  label: string
  type: 'info' | 'success' | 'warning' | 'danger'
}
