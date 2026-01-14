import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InventoryItem, UsageTrend, OutboundItem } from '@/types'
import { useExpiry } from '@/composables/useExpiry'
import {
  getInventoryList,
  importInventory as importInventoryApi,
  batchImportInventory,
  markOutboundFinished as markOutboundFinishedApi,
  deleteInventory,
} from '@/api/inventory'
import { applyOutbound, getAllOutboundList } from '@/api/outbound'
import type { InboundDTO } from '@/api/inventory'
import { ElMessage } from 'element-plus'

export const useInventoryStore = defineStore('inventory', () => {
  const { getExpiryStatus } = useExpiry()

  const inventory = ref<InventoryItem[]>([])
  const outboundRecords = ref<OutboundItem[]>([])
  const usageTrend = ref<UsageTrend[]>([
    { label: '1月', value: 45, color: 'bg-blue-500' },
    { label: '2月', value: 52, color: 'bg-blue-500' },
    { label: '3月', value: 38, color: 'bg-blue-500' },
    { label: '4月', value: 65, color: 'bg-indigo-500' },
    { label: '5月', value: 48, color: 'bg-blue-500' },
    { label: '6月', value: 60, color: 'bg-blue-500' },
  ]) // Mock data for now since API is missing

  const loading = ref(false)

  // Getters (Computed)
  const stats = computed(() => {
    const totalItems = inventory.value.length
    const warningItems = inventory.value.filter(
      (i) => getExpiryStatus(i.expiry_date).status === 'warning',
    ).length
    const expiredItems = inventory.value.filter(
      (i) => getExpiryStatus(i.expiry_date).status === 'expired',
    ).length
    return { totalItems, warningItems, expiredItems }
  })

  // Actions
  const fetchInventory = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res = await getInventoryList(params)
      // 兼容处理：支持直接返回数组或分页对象 { items: [], total: 0 }
      if (Array.isArray(res.data)) {
        inventory.value = res.data
      } else if (res.data && typeof res.data === 'object') {
        const data = res.data as {
          items?: InventoryItem[]
          list?: InventoryItem[]
          records?: InventoryItem[]
        }
        const list = data.items || data.list || data.records
        if (Array.isArray(list)) {
          inventory.value = list
        } else {
          inventory.value = []
          console.warn(
            'Inventory data format unexpected, expected array or { items: [] }:',
            res.data,
          )
        }
      } else {
        inventory.value = []
      }
    } catch {
      inventory.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchOutbound = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res = await getAllOutboundList(params as { page: number; page_size: number })
      // API returns { list: [], total: 0 }
      const data = res.data as { list?: OutboundItem[] }
      if (data && Array.isArray(data.list)) {
        outboundRecords.value = data.list
      } else {
        outboundRecords.value = []
      }
    } catch {
      outboundRecords.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async () => {
    // try {
    //   const res = await getDashboardStats()
    //   // 假设接口返回结构包含 trend
    //   if (res.data && (res.data as any).trend) {
    //     usageTrend.value = (res.data as any).trend
    //   }
    // } catch (error) {
    //   console.error('Failed to fetch stats', error)
    // }
    // Temporarily using mock data initialized in state
  }

  const importInventory = async (data: InboundDTO[]) => {
    try {
      // Loop call since API might be single item
      // Or if backend supports batch, pass data directly.
      // Assuming loop for safety based on single DTO schema
      for (const item of data) {
        await importInventoryApi(item)
      }
      ElMessage.success('导入成功')
      await fetchInventory() // 刷新列表
    } catch {
      // Error handled in interceptor
    }
  }

  const addInventoryItem = async (data: InboundDTO) => {
    loading.value = true
    try {
      await importInventoryApi(data)
      ElMessage.success('入库成功')
      await fetchInventory()
      return true
    } catch (error) {
      console.error('Failed to add inventory:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  const batchImport = async (file: File) => {
    // 强制刷新HMR
    loading.value = true
    try {
      if (!batchImportInventory) {
        throw new Error('API batchImportInventory is not defined')
      }
      const res = await batchImportInventory(file)
      return res.data
    } finally {
      loading.value = false
    }
  }

  const consumeItem = async (
    item: InventoryItem,
    quantity: number,
    purpose: string,
    opening_date: string,
    remarks?: string,
  ) => {
    try {
      await applyOutbound({
        inventory_id: item.id!,
        quantity,
        purpose,
        opening_date,
        remarks,
      })
      ElMessage.success('领用申请已提交')
      // 刷新数据
      await fetchInventory()
      await fetchOutbound()
    } catch (error) {
      throw error
    }
  }

  const markAsFinished = async (recordId: number) => {
    try {
      await markOutboundFinishedApi(recordId)
      ElMessage.success('状态更新成功')
      // 更新本地状态或刷新
      const record = outboundRecords.value.find((r) => r.id === recordId)
      if (record) {
        record.status = 'FINISHED'
      }
    } catch {
      // Error handled
    }
  }

  const deleteItem = async (id: number) => {
    try {
      loading.value = true
      await deleteInventory(id)
      ElMessage.success('删除成功')
      await fetchInventory()
    } catch (error) {
      console.error('Delete failed:', error)
      ElMessage.error('删除失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 初始化数据 (可选，或在组件中调用)
  const initData = () => {
    fetchInventory()
    fetchOutbound()
    fetchStats()
  }

  return {
    inventory,
    outboundRecords,
    usageTrend,
    stats,
    loading,
    fetchInventory,
    fetchOutbound,
    fetchStats,
    addInventoryItem,
    importInventory,
    batchImport,
    consumeItem,
    markAsFinished,
    deleteItem,
    initData,
  }
})
