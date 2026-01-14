import type { ExpiryStatus } from '@/types'

export function useExpiry() {
  const getExpiryStatus = (expiryDate: string, alertDays: number = 60): ExpiryStatus => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: '已过期',
        type: 'danger',
      }
    }
    if (diffDays <= alertDays) {
      return {
        status: 'warning',
        label: '即将过期',
        type: 'warning',
      }
    }
    return {
      status: 'normal',
      label: '正常',
      type: 'info', // Element Plus 'info' fits better than 'success' for normal text usually, or just plain
    }
  }

  return {
    getExpiryStatus,
  }
}
