<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { InventoryItem } from '@/types'
import { useInventoryStore } from '@/stores/inventory'

const props = defineProps<{
  modelValue: boolean
  items: InventoryItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const inventoryStore = useInventoryStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

interface BatchItemForm {
  item: InventoryItem
  quantity: number
  purpose: string
  opening_date: string
  remarks: string
}

const form = reactive({
  list: [] as BatchItemForm[]
})

// 批量设置表单
const batchSettings = reactive({
  purpose: '',
  opening_date: '',
})

// 用途选项
const purposeOptions = ['日常实验', '项目研发', '仪器维护', '教学演示', '其他']

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.list = props.items.map(item => ({
        item,
        quantity: 1,
        purpose: '',
        opening_date: new Date().toISOString().substring(0, 10),
        remarks: ''
      }))
      batchSettings.purpose = ''
      batchSettings.opening_date = new Date().toISOString().substring(0, 10)
    } else {
      formRef.value?.resetFields()
      form.list = []
    }
  },
)

const applyBatchSettings = () => {
  form.list.forEach(row => {
    if (batchSettings.purpose) row.purpose = batchSettings.purpose
    if (batchSettings.opening_date) row.opening_date = batchSettings.opening_date
  })
  ElMessage.success('已应用批量设置')
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.list.length === 0) return
      
      submitting.value = true
      try {
        await inventoryStore.batchConsumeItems(form.list)
        emit('success')
        handleClose()
      } catch (error) {
        // Error handled in store
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="批量领用"
    width="800px"
    @update:model-value="handleClose"
    destroy-on-close
  >
    <div class="batch-settings">
      <div class="settings-title">一键批量设置</div>
      <div class="settings-row">
        <el-select
          v-model="batchSettings.purpose"
          placeholder="统一用途"
          allow-create
          filterable
          style="width: 200px"
        >
          <el-option
            v-for="opt in purposeOptions"
            :key="opt"
            :label="opt"
            :value="opt"
          />
        </el-select>
        <el-date-picker
          v-model="batchSettings.opening_date"
          type="date"
          placeholder="统一开封日期"
          style="width: 200px"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" plain @click="applyBatchSettings">应用到所有</el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      class="batch-form"
    >
      <el-table :data="form.list" style="width: 100%" max-height="400px">
        <el-table-column label="物料名称" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.item.material?.name }}
            <div class="text-xs text-gray-400">库存: {{ row.item.current_qty }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="领用数量" width="140">
          <template #default="{ row, $index }">
            <el-form-item
              :prop="`list.${$index}.quantity`"
              :rules="[
                { required: true, message: '必填', trigger: 'blur' },
                { type: 'number', min: 1, max: row.item.current_qty, message: '数量无效', trigger: 'blur' }
              ]"
              style="margin-bottom: 0;"
            >
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="row.item.current_qty"
                controls-position="right"
                style="width: 100%"
                size="small"
              />
            </el-form-item>
          </template>
        </el-table-column>

        <el-table-column label="用途" width="160">
          <template #default="{ row, $index }">
            <el-form-item
              :prop="`list.${$index}.purpose`"
              :rules="[{ required: true, message: '必填', trigger: 'change' }]"
              style="margin-bottom: 0;"
            >
              <el-select
                v-model="row.purpose"
                placeholder="选择用途"
                allow-create
                filterable
                size="small"
                style="width: 100%"
              >
                <el-option
                  v-for="opt in purposeOptions"
                  :key="opt"
                  :label="opt"
                  :value="opt"
                />
              </el-select>
            </el-form-item>
          </template>
        </el-table-column>

        <el-table-column label="开封日期" width="160">
          <template #default="{ row, $index }">
            <el-form-item
              :prop="`list.${$index}.opening_date`"
              :rules="[{ required: true, message: '必填', trigger: 'change' }]"
              style="margin-bottom: 0;"
            >
              <el-date-picker
                v-model="row.opening_date"
                type="date"
                placeholder="开封日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                size="small"
              />
            </el-form-item>
          </template>
        </el-table-column>
      </el-table>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确认提交
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.batch-settings {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .settings-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12px;
  }

  .settings-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.text-xs {
  font-size: 12px;
}
.text-gray-400 {
  color: #94a3b8;
}

// Override table form item margins
:deep(.el-form-item__error) {
  position: static;
  padding-top: 2px;
}
</style>