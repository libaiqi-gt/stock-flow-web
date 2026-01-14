import request from '@/utils/http'
import type { DashboardApiStats } from '@/types'

export function getDashboardStats() {
  return request.get<DashboardApiStats>('api/v1/statistics/dashboard')
}
