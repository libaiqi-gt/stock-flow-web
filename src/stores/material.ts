import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Material } from '@/types'
import {
  getMaterialList,
  createMaterial as createMaterialApi,
  batchImportMaterial,
  type CreateMaterialDTO,
} from '@/api/material'
import { ElMessage } from 'element-plus'

export const useMaterialStore = defineStore('material', () => {
  const materials = ref<Material[]>([])
  const total = ref(0)
  const loading = ref(false)

  // Fetch materials with pagination
  const fetchMaterials = async (params: { page: number; page_size: number; name?: string }) => {
    loading.value = true
    try {
      const res = await getMaterialList(params)
      // Adapt to potential response structures (array or object with items)
      // Based on inventory store experience, backend might return array directly or wrapped object
      if (Array.isArray(res.data)) {
        materials.value = res.data
        // If backend returns just array, we can't really know total unless it's in headers or another field
        // For now, assume length if no total field
        total.value = res.data.length
      } else if (res.data && typeof res.data === 'object') {
        const data = res.data as {
          items?: Material[]
          list?: Material[]
          records?: Material[]
          total?: number
        }
        const list = data.items || data.list || data.records || []
        materials.value = Array.isArray(list) ? list : []
        total.value = data.total || materials.value.length
      } else {
        materials.value = []
        total.value = 0
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error)
      materials.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  // Create new material
  const createMaterial = async (data: CreateMaterialDTO) => {
    loading.value = true
    try {
      await createMaterialApi(data)
      ElMessage.success('物料创建成功')
      return true
    } catch (error) {
      // Error is usually handled by interceptor, but we catch here to return false
      console.error('Failed to create material:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  const batchImport = async (file: File) => {
    loading.value = true
    try {
      const res = await batchImportMaterial(file)
      return res.data
    } finally {
      loading.value = false
    }
  }

  return {
    materials,
    total,
    loading,
    fetchMaterials,
    createMaterial,
    batchImport,
  }
})
