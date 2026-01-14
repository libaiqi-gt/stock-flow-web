<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllOutboundList } from '@/api/outbound'
import { markOutboundFinished } from '@/api/inventory'
import type { OutboundItem } from '@/types'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { useExpiry } from '@/composables/useExpiry'

const { getExpiryStatus } = useExpiry()

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
  return date.substring(0, 10)
}

const calculateEffectiveExpiry = (row: OutboundItem) => {
  const inventoryExpiry = row.inventory?.expiry_date
  if (!inventoryExpiry) return ''

  const openDate = row.opening_date
  const openDays = Number(row.inventory?.material?.opened_expiry_days)
  // 如果没有开封效期限制，或者没有开封日期，则以库存有效期为准
  if (!openDays || !openDate) return inventoryExpiry

  // 计算开封后的截止日期
  const openDateObj = new Date(openDate)
  // 加上天数 (ms): 天 * 24小时 * 60分钟 * 60秒 * 1000毫秒
  const openExpiryTime = openDateObj.getTime() + openDays * 24 * 60 * 60 * 1000
  const invExpiryTime = new Date(inventoryExpiry).getTime()
  console.log('openExpiryTime', openExpiryTime)
  console.log('invExpiryTime', invExpiryTime)
  // 取较早的日期
  if (openExpiryTime < invExpiryTime) {
    return new Date(openExpiryTime).toISOString().substring(0, 10)
  }
  return inventoryExpiry
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
        <el-table-column prop="outbound_no" label="单号" width="160" show-overflow-tooltip />
        <el-table-column label="领用人" width="120">
          <template #default="{ row }">
            {{ row.user?.real_name || row.user?.username }}
          </template>
        </el-table-column>
        <el-table-column label="物料名称" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.inventory?.material?.name }}
          </template>
        </el-table-column>
        <el-table-column label="规格" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.inventory?.material?.spec }}
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">
            {{ row.quantity }} {{ row.inventory?.material?.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="用途" width="120" show-overflow-tooltip />
        <el-table-column label="开封日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.opening_date) }}
          </template>
        </el-table-column>
        <el-table-column label="有效期至" width="160">
          <template #default="{ row }">
            <div class="expiry-wrapper">
              <span
                :class="`expiry-${getExpiryStatus(calculateEffectiveExpiry(row), row.inventory?.material?.expiry_alert_days).status}`"
              >
                {{ formatDate(calculateEffectiveExpiry(row)) }}
              </span>
              <el-tag
                v-if="
                  getExpiryStatus(
                    calculateEffectiveExpiry(row),
                    row.inventory?.material?.expiry_alert_days,
                  ).status === 'expired'
                "
                type="danger"
                size="small"
                effect="plain"
                class="warning-tag"
              >
                已过期
              </el-tag>
              <el-tag
                v-else-if="
                  getExpiryStatus(
                    calculateEffectiveExpiry(row),
                    row.inventory?.material?.expiry_alert_days,
                  ).status === 'warning'
                "
                type="warning"
                size="small"
                effect="plain"
                class="warning-tag"
              >
                即将过期
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="申请日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.apply_date) }}
          </template>
        </el-table-column>
        <el-table-column label="使用状态" width="100" align="center">
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

.expiry-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.warning-tag {
  font-size: 10px;
  height: 20px;
  padding: 0 4px;
}

/* Expiry status colors - keeping consistent with other views */
.expiry-expired {
  color: #f56c6c;
  font-weight: bold;
}

.expiry-warning {
  color: #e6a23c;
  font-weight: bold;
}

.expiry-normal {
  color: #606266;
}
</style>
