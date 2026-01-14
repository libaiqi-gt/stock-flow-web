<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useMaterialStore } from '@/stores/material'
import type { CreateMaterialDTO } from '@/api/material'
import { Warning } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const materialStore = useMaterialStore()
const formRef = ref<FormInstance>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const formData = reactive<CreateMaterialDTO>({
  code: '',
  name: '',
  category: '',
  spec: '',
  unit: '',
  brand: '',
  safety_stock: undefined,
  expiry_alert_days: undefined,
  opened_expiry_days: undefined,
})

// Local state for Year/Month inputs
const openExpiryYears = ref<number | undefined>(undefined)
const openExpiryMonths = ref<number | undefined>(undefined)

const totalOpenExpiryDays = computed(() => {
  const y = openExpiryYears.value || 0
  const m = openExpiryMonths.value || 0
  if (y === 0 && m === 0) return 0
  return y * 365 + m * 30
})

// Update formData when years/months change
watch([openExpiryYears, openExpiryMonths], () => {
  // If both are undefined/empty, set result to undefined to avoid sending 0 if that's not desired
  // However, requirement says "0年0月" is a boundary. If user enters 0, 0, result is 0.
  // But validator requires min: 1. So 0 days is invalid, which is correct.
  if (openExpiryYears.value === undefined && openExpiryMonths.value === undefined) {
    formData.opened_expiry_days = undefined
  } else {
    formData.opened_expiry_days = totalOpenExpiryDays.value
  }
})

const rules = reactive<FormRules>({
  code: [
    { required: true, message: '请输入物料编号', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择物料类型', trigger: 'change' }],
  spec: [{ required: true, message: '请输入规格型号', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
  brand: [{ required: true, message: '请输入厂家/品牌', trigger: 'blur' }],
  safety_stock: [{ type: 'number', min: 0, message: '安全库存必须大于等于0', trigger: 'blur' }],
  expiry_alert_days: [{ type: 'number', min: 1, message: '报警时限必须大于0', trigger: 'blur' }],
  opened_expiry_days: [{ type: 'number', min: 1, message: '有效期必须大于0', trigger: 'blur' }],
})

// Categories and Units options
const categories = ['试剂', '耗材', '标准品', '仪器配件', '其他']
const units = ['瓶', '盒', '包', '支', '个', 'kg', 'g', 'L', 'mL', '套']

// Reset form when dialog opens/closes
watch(visible, (val) => {
  if (!val) {
    formRef.value?.resetFields()
    openExpiryYears.value = undefined
    openExpiryMonths.value = undefined
  }
})

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      const success = await materialStore.createMaterial(formData)
      if (success) {
        visible.value = false
        emit('success')
      }
    }
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="新增物料"
    width="600px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="物料编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入唯一编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物料名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="物料类型" prop="category">
            <el-select v-model="formData.category" placeholder="请选择类型" class="w-full">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单位" prop="unit">
            <el-select v-model="formData.unit" placeholder="请选择单位" class="w-full">
              <el-option v-for="u in units" :key="u" :label="u" :value="u" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="规格型号" prop="spec">
            <el-input v-model="formData.spec" placeholder="例如: 500g/瓶" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="厂家/品牌" prop="brand">
            <el-input v-model="formData.brand" placeholder="请输入品牌" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">预警设置</el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="安全库存" prop="safety_stock">
            <el-input-number
              v-model="formData.safety_stock"
              :min="0"
              controls-position="right"
              class="w-full"
              placeholder="0"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="效期报警(天)" prop="expiry_alert_days">
            <el-input-number
              v-model="formData.expiry_alert_days"
              :min="1"
              controls-position="right"
              class="w-full"
              placeholder="默认60天"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="开封有效期" prop="opened_expiry_days">
            <div class="expiry-container">
              <div class="expiry-inputs">
                <div class="input-group">
                  <el-input-number
                    v-model="openExpiryYears"
                    :min="0"
                    :max="10"
                    :precision="0"
                    controls-position="right"
                    placeholder="0"
                    style="width: 110px"
                  />
                  <span class="unit-label">年</span>
                </div>
                <div class="input-group">
                  <el-input-number
                    v-model="openExpiryMonths"
                    :min="0"
                    :max="11"
                    :precision="0"
                    controls-position="right"
                    placeholder="0"
                    style="width: 110px"
                  />
                  <span class="unit-label">月</span>
                </div>
              </div>
              <div class="expiry-result" v-if="totalOpenExpiryDays > 0">
                <span class="result-text">自动换算: {{ totalOpenExpiryDays }} 天</span>
                <span v-if="totalOpenExpiryDays > 3650" class="warning-text">
                  <el-icon><Warning /></el-icon> 超过10年
                </span>
              </div>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="materialStore.loading" @click="handleSubmit">
          确认新增
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.w-full {
  width: 100%;
}

.expiry-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.expiry-inputs {
  display: flex;
  gap: 16px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-label {
  color: #606266;
  font-size: 14px;
}

.expiry-result {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: 1.5;
  margin-top: 4px;
}

.warning-text {
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
