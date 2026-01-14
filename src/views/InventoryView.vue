<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useUserStore } from '@/stores/user'
import { useExpiry } from '@/composables/useExpiry'
import { Search, Refresh, Upload } from '@element-plus/icons-vue'
import ConsumeModal from '@/components/ConsumeModal.vue'
import type { InventoryItem } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const inventoryStore = useInventoryStore()
const userStore = useUserStore()
const { getExpiryStatus } = useExpiry()

const searchTerm = ref('')
const showConsumeModal = ref(false)
const selectedItem = ref<InventoryItem | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)

const isBelowSafetyStock = (item: InventoryItem) => {
  const current = Number(item.current_qty)
  // 尝试获取 safety_stock，兼容可能的大小写或嵌套问题
  const mat = item.material as unknown as Record<string, number>
  const safety = Number(mat?.safety_stock ?? mat?.safetyStock)
  if (isNaN(current) || isNaN(safety)) return false
  if (safety < 0) return false

  return current <= safety
}

onMounted(() => {
  inventoryStore.fetchInventory()
})

const filteredInventory = computed(() => {
  const data = inventoryStore.inventory
  console.log(data, 'data')
  if (!Array.isArray(data)) return []
  if (!searchTerm.value) return data
  const term = searchTerm.value.toLowerCase()
  return data.filter(
    (item) =>
      item.material?.name.toLowerCase().includes(term) ||
      item.material?.code.toLowerCase().includes(term) ||
      item.batch_no.toLowerCase().includes(term),
  )
})

const handleRefresh = () => {
  inventoryStore.fetchInventory()
  ElMessage.success('数据已更新')
}

const openConsumeModal = (item: InventoryItem) => {
  selectedItem.value = item
  showConsumeModal.value = true
}

const handleDelete = (item: InventoryItem) => {
  ElMessageBox.confirm('确认删除该库存记录吗？此操作不可恢复。', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await inventoryStore.deleteItem(item.id)
    })
    .catch(() => {
      // cancel
    })
}

/**
 * 触发文件选择
 */
const handleImportClick = () => {
  fileInput.value?.click()
}

/**
 * 处理文件上传
 */
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
    // 3. 调用导入接口
    // 确保方法存在 (防HMR不同步)
    if (typeof inventoryStore.batchImport !== 'function') {
      console.error('inventoryStore.batchImport is missing', inventoryStore)
      throw new Error('批量导入功能未正确初始化，请尝试刷新页面')
    }
    const result = await inventoryStore.batchImport(file)

    // 4. 显示结果统计
    if (result) {
      const { success, failed, errors } = result
      const msg = `导入完成：成功 ${success} 条，失败 ${failed} 条`
      if (failed > 0) {
        // 如果有失败，显示详细信息
        // 由于错误信息可能很多，这里简单展示或引导查看详情
        // 简单处理：显示前3条错误
        const errorDetails = errors.slice(0, 3).join('; ')
        ElMessageBox.alert(
          `<div><p>${msg}</p><p style="color: red; margin-top: 10px;">错误示例: ${errorDetails}${errors.length > 3 ? '...' : ''}</p></div>`,
          '导入结果',
          { dangerouslyUseHTMLString: true },
        )
      } else {
        ElMessage.success(msg)
      }

      // 5. 自动刷新列表
      await inventoryStore.fetchInventory()
    }
  } catch (error) {
    console.error('Import failed:', error)
    ElMessage.error('导入失败，请重试')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="inventory-view">
    <div class="card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <el-input
            v-model="searchTerm"
            placeholder="搜索编码、名称或批号..."
            :prefix-icon="Search"
            clearable
          />
        </div>
        <div class="actions">
          <!-- 隐藏的文件输入框 -->
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx, .xls"
            style="display: none"
            @change="handleFileChange"
          />
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
            type="primary"
            plain
            :icon="Refresh"
            :loading="inventoryStore.loading"
            @click="handleRefresh"
          >
            刷新列表
          </el-button>
        </div>
      </div>

      <!-- Table -->
      <el-table
        v-loading="inventoryStore.loading"
        :data="filteredInventory"
        style="width: 100%"
        class="custom-table"
      >
        <el-table-column prop="inbound_no" label="入库单号" min-width="150" show-overflow-tooltip />
        <el-table-column
          prop="material.code"
          label="物料编号"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column prop="material.category" label="物料类型" min-width="100" />
        <el-table-column
          prop="material.name"
          label="物料名称"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="material.spec" label="规格" min-width="120" show-overflow-tooltip />
        <el-table-column prop="initial_qty" label="数量" min-width="100" align="right" />
        <el-table-column
          prop="material.brand"
          label="厂家/品牌"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column prop="batch_no" label="内部批号" min-width="120" show-overflow-tooltip />
        <el-table-column label="当前库存数量" min-width="140" align="right">
          <template #default="{ row }">
            <div class="stock-cell">
              <el-tooltip
                v-if="isBelowSafetyStock(row)"
                effect="dark"
                :content="`安全库存: ${row.material?.safety_stock ?? row.material?.safetyStock}`"
                placement="top"
              >
                <div class="warning-wrapper">
                  <span class="text-danger"> {{ row.current_qty }} {{ row.material?.unit }} </span>
                  <el-tag type="danger" size="small" effect="plain" class="warning-tag">
                    低于安全库存
                  </el-tag>
                </div>
              </el-tooltip>
              <span v-else> {{ row.current_qty }} {{ row.material?.unit }} </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期至" min-width="120">
          <template #default="{ row }">
            <span :class="getExpiryStatus(row.expiry_date).status">
              {{ row.expiry_date ? row.expiry_date.substring(0, 10) : '-' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="openConsumeModal(row)"
              :disabled="row.current_qty <= 0"
            >
              领用
            </el-button>
            <el-button
              v-if="userStore.currentUser?.role === 'Admin'"
              type="danger"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ConsumeModal v-model="showConsumeModal" :item="selectedItem" />
  </div>
</template>

<style lang="less" scoped>
.inventory-view {
  animation: fadeIn 0.5s ease-out;
}

.card {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 8rem); // Adjust based on layout
}

.toolbar {
  padding: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background-color: rgba(255, 255, 255, 0.5);

  .search-box {
    flex: 1;
    max-width: 24rem;
  }
}

.custom-table {
  flex: 1;

  :deep(.el-table__header) {
    th {
      background-color: #f8fafc;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
  }

  .warning {
    color: #f97316;
    font-weight: bold;
  }
  .expired {
    color: #dc2626;
    font-weight: bold;
  }
  .normal {
    color: #10b981;
  }

  .stock-cell {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    .warning-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }

    .text-danger {
      color: #dc2626;
      font-weight: bold;
    }

    .warning-tag {
      margin-top: 2px;
      font-size: 0.7rem;
      transform: scale(0.9);
      transform-origin: right center;
    }
  }
}
</style>
