<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { useMaterialStore } from '@/stores/material'
import { useUserStore } from '@/stores/user'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import MaterialModal from '@/components/MaterialModal.vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { deleteMaterial } from '@/api/material'

const materialStore = useMaterialStore()
const userStore = useUserStore()

const searchName = ref('')
const showModal = ref(false)
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
        <div class="left-actions">
          <el-button type="primary" :icon="Plus" @click="showModal = true">新增物料</el-button>
        </div>

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
