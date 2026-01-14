<script setup lang="ts">
import { onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { Check } from '@element-plus/icons-vue'

const inventoryStore = useInventoryStore()

onMounted(() => {
  inventoryStore.fetchOutbound()
})

const handleMarkAsFinished = (id: number) => {
  inventoryStore.markAsFinished(id)
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusType = (status: string) => {
  return status === 'FINISHED' ? 'info' : 'warning'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    USING: '使用中',
    FINISHED: '已用完',
  }
  return map[status] || status
}
</script>

<template>
  <div class="outbound-view">
    <div class="card">
      <el-table
        v-loading="inventoryStore.loading"
        :data="inventoryStore.outboundRecords"
        style="width: 100%"
        class="custom-table"
      >
        <el-table-column label="领用单号 / 时间" min-width="180">
          <template #default="{ row }">
            <div class="record-info">
              <div class="no font-mono">{{ row.outbound_no }}</div>
              <div class="date text-xs text-gray-400">{{ formatDate(row.apply_date) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="领用物资" min-width="220">
          <template #default="{ row }">
            <div class="item-info">
              <div class="name font-bold">{{ row.inventory?.material?.name }}</div>
              <div class="meta text-xs text-gray-400">
                {{ row.inventory?.material?.code }} | {{ row.inventory?.material?.spec }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="领用详情" min-width="180">
          <template #default="{ row }">
            <div class="usage-info">
              <div>
                <span class="font-bold text-red-600">{{ row.quantity }}</span>
                {{ row.inventory?.material?.unit }}
              </div>
              <div class="text-xs text-gray-500">用途: {{ row.purpose }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="领用人" min-width="120">
          <template #default="{ row }">
            {{ row.user?.real_name || row.user?.username }}
          </template>
        </el-table-column>

        <el-table-column label="当前状态" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'FINISHED'"
              type="primary"
              link
              :icon="Check"
              @click="handleMarkAsFinished(row.id)"
            >
              标记用完
            </el-button>
            <span v-else class="text-xs text-gray-300">--</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style lang="less" scoped>
.outbound-view {
  animation: fadeIn 0.5s ease-out;
}

.card {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: calc(100vh - 8rem);
  display: flex;
  flex-direction: column;
}

.custom-table {
  flex: 1;

  .font-mono {
    font-family: monospace;
  }
  .font-bold {
    font-weight: 700;
  }
  .text-xs {
    font-size: 0.75rem;
  }
  .text-red-600 {
    color: #dc2626;
  }
  .text-gray-400 {
    color: #94a3b8;
  }
  .text-gray-500 {
    color: #64748b;
  }
  .text-gray-300 {
    color: #cbd5e1;
  }
}
</style>
