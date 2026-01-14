<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getAuditList, auditOutbound } from '@/api/outbound'
import type { OutboundItem } from '@/types'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { Refresh, Check, Close } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// Permission check
if (userStore.currentUser?.role !== 'Admin') {
  ElMessage.error('无权访问此页面')
  router.push('/')
}

const statusFilter = ref<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
const loading = ref(false)
const list = ref<OutboundItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const fetchList = async () => {
  loading.value = true
  try {
    const params: {
      page: number
      page_size: number
      approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    } = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (statusFilter.value !== 'ALL') {
      params.approval_status = statusFilter.value
    }
    const res = await getAuditList(params)
    const data = res.data as { list?: OutboundItem[]; total?: number }
    if (data) {
      list.value = data.list || []
      total.value = data.total || 0
    }
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

watch([statusFilter, page, pageSize], () => {
  fetchList()
})

const handleRefresh = () => {
  fetchList()
}

const handlePageChange = (val: number) => {
  page.value = val
  fetchList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  page.value = 1 // Reset to first page
  fetchList()
}

onMounted(() => {
  fetchList()
})

// Audit Modal
const auditDialogVisible = ref(false)
const currentAuditItem = ref<OutboundItem | null>(null)
const auditForm = reactive({
  approved: true, // true: Pass, false: Reject
  opinion: '',
})
const auditLoading = ref(false)

const openAuditDialog = (row: OutboundItem) => {
  currentAuditItem.value = row
  auditForm.approved = true
  auditForm.opinion = ''
  auditDialogVisible.value = true
}

const handleAuditSubmit = async () => {
  if (!currentAuditItem.value) return

  if (auditForm.approved === false && !auditForm.opinion.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }

  auditLoading.value = true
  try {
    await auditOutbound({
      id: currentAuditItem.value.id,
      approved: auditForm.approved,
      opinion: auditForm.opinion,
    })
    ElMessage.success('审批完成')
    auditDialogVisible.value = false
    fetchList()
  } catch (err: unknown) {
    // handled by interceptor
    ElMessage.error((err as Error).message || '审批失败')
  } finally {
    auditLoading.value = false
  }
}

// Status Badge Helper
const getStatusType = (status: string) => {
  const s = status.toUpperCase()
  switch (s) {
    case 'PENDING':
      return 'warning'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  const s = status.toUpperCase()
  switch (s) {
    case 'PENDING':
      return '待审批'
    case 'APPROVED':
      return '已通过'
    case 'REJECTED':
      return '已驳回'
    default:
      return status
  }
}
</script>

<template>
  <div class="approval-view">
    <div class="card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="filter-box">
          <span class="label">审批状态：</span>
          <el-select v-model="statusFilter" placeholder="请选择状态" style="width: 120px">
            <el-option label="全部" value="ALL" />
            <el-option label="待审批" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </div>

        <div class="actions">
          <el-button type="primary" plain :icon="Refresh" :loading="loading" @click="handleRefresh">
            刷新列表
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" style="width: 100%" stripe class="custom-table">
        <el-table-column prop="outbound_no" label="领用单号" width="150" />
        <el-table-column label="物料名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.inventory?.material?.name || row.material_name }}
          </template>
        </el-table-column>
        <el-table-column label="物料编码" width="120">
          <template #default="{ row }">
            {{ row.inventory?.material?.code || row.material_code }}
          </template>
        </el-table-column>
        <el-table-column label="规格" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.inventory?.material?.spec || row.spec }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="领用数量" width="100" align="right">
          <template #default="{ row }">
            {{ row.quantity }} {{ row.inventory?.material?.unit || row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="100" align="center">
          <template #default="{ row }">
            {{ row.user?.real_name || row.applicant_name }}
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.apply_date ? new Date(row.apply_date).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开封日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.opening_date ? row.opening_date.substring(0, 10) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="用途" min-width="120" show-overflow-tooltip />
        <el-table-column prop="approval_status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.approval_status)" effect="plain">
              {{ getStatusText(row.approval_status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.approval_status === 'PENDING'"
              type="primary"
              link
              @click="openAuditDialog(row)"
            >
              审批
            </el-button>
            <span v-else class="text-gray-400 text-xs">--</span>
          </template>
        </el-table-column>

        <!-- Show audit opinion for processed items -->
        <el-table-column
          label="审批意见"
          min-width="150"
          v-if="statusFilter !== 'PENDING'"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.approval_opinion || '-' }}
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
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Audit Dialog -->
    <el-dialog
      v-model="auditDialogVisible"
      title="审批处理"
      width="480px"
      destroy-on-close
      class="audit-dialog"
      align-center
    >
      <div v-if="currentAuditItem" class="audit-content">
        <!-- Info Section -->
        <div class="info-card">
          <div class="info-row">
            <span class="label">申请人员：</span>
            <span class="value">{{
              currentAuditItem.user?.real_name || currentAuditItem.applicant_name
            }}</span>
          </div>
          <div class="info-row">
            <span class="label">申请物料：</span>
            <span class="value font-medium">
              {{ currentAuditItem.inventory?.material?.name || currentAuditItem.material_name }}
            </span>
          </div>
          <div class="info-row">
            <span class="label">规格/数量：</span>
            <span class="value">
              {{ currentAuditItem.inventory?.material?.spec || currentAuditItem.spec }} /
              <span class="text-primary font-bold">{{ currentAuditItem.quantity }}</span>
              {{ currentAuditItem.inventory?.material?.unit || currentAuditItem.unit }}
            </span>
          </div>
          <div class="info-row">
            <span class="label">申请用途：</span>
            <span class="value">{{ currentAuditItem.purpose }}</span>
          </div>
        </div>

        <!-- Form Section -->
        <el-form :model="auditForm" label-position="top" class="audit-form">
          <el-form-item label="审批结果" required>
            <div class="radio-group-custom">
              <div
                class="radio-option success"
                :class="{ active: auditForm.approved === true }"
                @click="auditForm.approved = true"
              >
                <el-icon><Check /></el-icon>
                <span>通过</span>
              </div>
              <div
                class="radio-option danger"
                :class="{ active: auditForm.approved === false }"
                @click="auditForm.approved = false"
              >
                <el-icon><Close /></el-icon>
                <span>驳回</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="审批意见">
            <el-input
              v-model="auditForm.opinion"
              type="textarea"
              :placeholder="
                auditForm.approved ? '请输入通过意见（选填）' : '请输入驳回原因（必填）'
              "
              :rows="3"
              resize="none"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="auditDialogVisible = false" plain>取消</el-button>
          <el-button type="primary" :loading="auditLoading" @click="handleAuditSubmit">
            确认提交
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.approval-view {
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

  .filter-box {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 14px;
      color: #64748b;
    }
  }
}

.custom-table {
  flex: 1;
  overflow: hidden;

  :deep(.el-table__header) {
    font-weight: 600;
    color: #475569;
  }
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

// Audit Dialog Styles
.info-card {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;

  .info-row {
    display: flex;
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 1.5;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #64748b;
      width: 80px;
      flex-shrink: 0;
    }

    .value {
      color: #1e293b;
      font-weight: 400;

      &.font-medium {
        font-weight: 500;
      }
    }
  }
}

.radio-group-custom {
  display: flex;
  gap: 16px;
  width: 100%;

  .radio-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: #64748b;

    &:hover {
      background-color: #f8fafc;
    }

    &.success.active {
      background-color: #ecfdf5;
      border-color: #10b981;
      color: #10b981;
    }

    &.danger.active {
      background-color: #fef2f2;
      border-color: #ef4444;
      color: #ef4444;
    }
  }
}

.text-primary {
  color: var(--el-color-primary);
}
</style>
