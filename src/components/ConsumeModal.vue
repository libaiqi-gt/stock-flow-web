<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useUserStore } from '@/stores/user'
import type { InventoryItem } from '@/types'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  item: InventoryItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const inventoryStore = useInventoryStore()
const userStore = useUserStore()
const formRef = ref<FormInstance>()

const formData = reactive({
  qty: 1,
  purpose: '日常检测',
  opening_date: '',
  remarks: '',
})

const rules = reactive<FormRules>({
  qty: [
    { required: true, message: '请输入领用数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' },
  ],
  purpose: [{ required: true, message: '请选择领用用途', trigger: 'change' }],
  opening_date: [{ required: true, message: '请选择开封日期', trigger: 'change' }],
  remarks: [{ max: 100, message: '备注不能超过100个字符', trigger: 'blur' }],
})

const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Reset form when item changes or modal opens
watch(
  () => props.item,
  () => {
    formData.qty = 1
    formData.purpose = '日常检测'
    formData.opening_date = new Date().toISOString().split('T')[0] || ''
    formData.remarks = ''
  },
)

watch(visible, (val) => {
  if (val && props.item) {
    formData.qty = 1
    formData.purpose = '日常检测'
    formData.opening_date = new Date().toISOString().split('T')[0] || ''
    formData.remarks = ''
  }
})

const handleConfirm = async () => {
  if (!props.item || !userStore.currentUser) return
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (formData.qty > (props.item?.current_qty || 0)) {
        ElMessage.error('库存不足！')
        return
      }

      loading.value = true
      try {
        await inventoryStore.consumeItem(
          props.item!,
          formData.qty,
          formData.purpose,
          formData.opening_date,
          formData.remarks,
        )
        visible.value = false
        emit('success')
      } catch {
        // Error handled in store
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="物资领用登记"
    width="500px"
    destroy-on-close
    class="consume-modal"
  >
    <div v-if="item" class="modal-content">
      <div class="item-summary">
        <div class="summary-row">
          <span class="label">物资名称</span>
          <span class="value font-bold">{{ item.material?.name }}</span>
        </div>
        <div class="summary-row">
          <span class="label">规格/品牌</span>
          <span class="value">{{ item.material?.spec }} / {{ item.material?.brand }}</span>
        </div>
        <div class="summary-row">
          <span class="label">当前库存</span>
          <span class="value highlight">{{ item.current_qty }} {{ item.material?.unit }}</span>
        </div>
      </div>

      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="领用数量" prop="qty">
          <el-input-number v-model="formData.qty" :min="1" :max="item.current_qty" class="w-full" />
        </el-form-item>

        <el-form-item label="领用用途" prop="purpose">
          <el-select v-model="formData.purpose" class="w-full">
            <el-option label="日常检测" value="日常检测" />
            <el-option label="实验储备" value="实验储备" />
            <el-option label="环境监测" value="环境监测" />
            <el-option label="研发测试" value="研发测试" />
            <el-option label="其他用途" value="其他用途" />
          </el-select>
        </el-form-item>

        <el-form-item label="开封日期" prop="opening_date">
          <el-date-picker
            v-model="formData.opening_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            :rows="2"
            maxlength="100"
            show-word-limit
            placeholder="请输入备注（选填）"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm"> 确认领用 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.item-summary {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;

    .label {
      color: #64748b;
    }
    .value {
      color: #1e293b;
    }
    .font-bold {
      font-weight: 700;
    }
    .highlight {
      color: #dc2626;
      font-weight: 700;
    }
  }
}

:deep(.el-dialog) {
  border-radius: 1rem;
  overflow: hidden;

  .el-dialog__header {
    margin-right: 0;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;

    .el-dialog__title {
      font-weight: 700;
      color: #1e293b;
    }
  }

  .el-dialog__body {
    padding: 1.5rem;
  }

  .el-dialog__footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #f1f5f9;
    background-color: #f8fafc;
  }
}
</style>
