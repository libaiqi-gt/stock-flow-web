<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useMaterialStore } from '@/stores/material'
import { useUserStore } from '@/stores/user'
import { Search, Plus, Delete, Upload, Download } from '@element-plus/icons-vue'
import MaterialModal from '@/components/MaterialModal.vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { deleteMaterial } from '@/api/material'

const materialStore = useMaterialStore()
const userStore = useUserStore()

const searchName = ref('')
const showModal = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const isDownloadingTemplate = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const fetchData = () => {
  materialStore.fetchMaterials({
    page: pagination.page,
    page_size: pagination.pageSize,
    name: searchName.value || undefined,
  })
}

const handleAddSuccess = () => {
  fetchData()
}

/**
 * 下载Excel模板
 */
const handleDownloadTemplate = async () => {
  isDownloadingTemplate.value = true
  try {
    // 使用 import.meta.env.BASE_URL 确保路径正确 (Vite)
    const baseUrl = import.meta.env.BASE_URL
    const templateUrl = `${baseUrl}物料模板.xlsx`.replace('//', '/')

    const response = await fetch(templateUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '物料模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download template failed:', error)
    ElMessage.error('下载模板失败，请检查文件是否存在')
  } finally {
    isDownloadingTemplate.value = false
  }
}

const handleImportClick = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  if (!file) return

  // 重置 input value，允许重复上传同一文件
  input.value = ''

  // 1. 校验文件格式
  const isExcel = /\.(xlsx|xls)$/.test(file.name)
  if (!isExcel) {
    ElMessage.error('仅支持上传 .xlsx 或 .xls 格式的文件')
    return
  }

  // 2. 校验文件大小 (10MB)
  const isLt10M = file.size / 1024 / 1024 <= 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }

  try {
    isImporting.value = true
    const result = await materialStore.batchImport(file)
    if (result) {
      const { success, failed, errors } = result
      const msg = `导入完成：成功 ${success} 条，失败 ${failed} 条`
      if (failed > 0) {
        // 如果有失败，显示详细信息
        const errorDetails = errors.slice(0, 3).join('; ')
        ElMessageBox.alert(
          `<div><p>${msg}</p><p style="color: red; margin-top: 10px;">错误示例: ${errorDetails}${
            errors.length > 3 ? '...' : ''
          }</p></div>`,
          '导入结果',
          { dangerouslyUseHTMLString: true },
        )
      } else {
        ElMessage.success(msg)
      }
      // 刷新列表
      fetchData()
    }
  } catch (error) {
    console.error('Import failed:', error)
    ElMessage.error('导入失败，请重试')
  } finally {
    isImporting.value = false
  }
}

const handleDelete = (row: Record<string, unknown>) => {
  ElMessageBox.confirm(
    `确定要删除物料 "${row?.name}" 吗？此操作不可恢复，且可能影响相关库存记录。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )
    .then(async () => {
      try {
        await deleteMaterial(row.id as number)
        ElMessage.success('删除成功')
        // 刷新当前页
        fetchData()
      } catch (error) {
        console.error('Failed to delete material:', error)
        // Error handled in interceptor usually, but safe to log
      }
    })
    .catch(() => {
      // cancel
    })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="material-view">
    <div class="card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <el-input
            v-model="searchName"
            placeholder="搜索物料名称..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
        <div class="left-actions">
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx, .xls"
            style="display: none"
            @change="handleFileChange"
          />
          <el-button type="primary" :icon="Plus" @click="showModal = true">新增物料</el-button>
          <el-tooltip content="点击导入Excel数据" placement="top">
            <el-button
              type="success"
              plain
              :icon="Upload"
              :loading="isImporting"
              @click="handleImportClick"
            >
              导入数据
            </el-button>
          </el-tooltip>
          <el-button
            type="warning"
            plain
            :icon="Download"
            :loading="isDownloadingTemplate"
            @click="handleDownloadTemplate"
          >
            下载Excel模板
          </el-button>
        </div>
      </div>

      <!-- Table -->
      <el-table
        v-loading="materialStore.loading"
        :data="materialStore.materials"
        style="width: 100%"
        stripe
        class="custom-table"
      >
        <el-table-column prop="code" label="物料编号" min-width="120" fixed />
        <el-table-column prop="name" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="物料类型" min-width="100">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="spec" label="规格型号" min-width="120" />
        <el-table-column prop="unit" label="单位" width="80" align="center" />
        <el-table-column prop="brand" label="厂家/品牌" min-width="120" />

        <el-table-column prop="safety_stock" label="安全库存" width="100" align="right">
          <template #default="{ row }">
            {{ row.safety_stock ?? '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="expiry_alert_days" label="效期预警(天)" width="120" align="center">
          <template #default="{ row }">
            {{ row.expiry_alert_days ?? '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="opened_expiry_days" label="开封效期(天)" width="120" align="center">
          <template #default="{ row }">
            {{ row.opened_expiry_days ?? '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ row.created_at?.substring(0, 10) }}
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="100"
          fixed="right"
          align="center"
          v-if="userStore.currentUser?.role === 'Admin'"
        >
          <template #default="{ row }">
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="materialStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <MaterialModal v-model="showModal" @success="handleAddSuccess" />
  </div>
</template>

<style lang="less" scoped>
.material-view {
  height: 100%;
  animation: fadeIn 0.5s ease-out;
}

.card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px); // Adapt to layout
  overflow: hidden;
}

.toolbar {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;

  .search-box {
    width: 300px;
  }
}

.custom-table {
  flex: 1;
  overflow: hidden;
}

.pagination-container {
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  background-color: white;
}
</style>
