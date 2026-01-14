<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllOutboundList } from '@/api/outbound'
import { markOutboundFinished } from '@/api/inventory'
import type { OutboundItem } from '@/types'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

const loading = ref(false)
const list = ref<OutboundItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAllOutboundList({
      page: page.value,
      page_size: pageSize.value,
    })
    const data = res.data as { list?: OutboundItem[]; total?: number }
    if (data) {
      list.value = data.list || []
      total.value = data.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = () => {
  fetchList()
}

onMounted(() => {
  fetchList()
})

// Status Helper
const getStatusType = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    case 'USING':
      return 'primary'
    case 'FINISHED':
      return 'info'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '待审批'
    case 'APPROVED':
      return '已通过'
    case 'REJECTED':
      return '已驳回'
    case 'USING':
      return '使用中'
    case 'FINISHED':
      return '已用完'
    default:
      return status
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const handleMarkFinished = (row: OutboundItem) => {
  ElMessageBox.confirm('确定要将该条记录标记为已用完吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await markOutboundFinished(row.id)
        ElMessage.success('操作成功')
        fetchList()
      } catch (error) {
        console.error(error)
      }
    })
    .catch(() => {
      // cancel
    })
}
</script>

<template>
  <div class="consumption-history">
    <div class="card">
      <div class="toolbar">
        <div class="title">全部领用记录</div>
      </div>

      <el-table v-loading="loading" :data="list" stripe class="custom-table" style="width: 100%">
        <el-table-column prop="outbound_no" label="单号" width="160" />
        <el-table-column label="领用人" width="120">
          <template #default="{ row }">
            {{ row.user?.real_name || row.user?.username }}
          </template>
        </el-table-column>
        <el-table-column label="物料名称" min-width="120">
          <template #default="{ row }">
            {{ row.inventory?.material?.name }}
          </template>
        </el-table-column>
        <el-table-column label="规格" width="120">
          <template #default="{ row }">
            {{ row.inventory?.material?.spec }}
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">
            {{ row.quantity }} {{ row.inventory?.material?.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="用途" width="120" />
        <el-table-column label="开封日期" width="160">
          <template #default="{ row }">
            {{ formatDate(row.opening_date) }}
          </template>
        </el-table-column>
        <el-table-column label="申请日期" width="160">
          <template #default="{ row }">
            {{ formatDate(row.apply_date) }}
          </template>
        </el-table-column>
        <el-table-column label="使用状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'FINISHED'"
              type="primary"
              link
              :icon="Check"
              @click="handleMarkFinished(row)"
            >
              标记用完
            </el-button>
            <span v-else class="text-gray-400 text-xs">--</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.consumption-history {
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
  height: calc(100vh - 120px);
  overflow: hidden;
}

.toolbar {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
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

.text-gray-400 {
  color: #94a3b8;
}
.text-xs {
  font-size: 12px;
}
</style>
