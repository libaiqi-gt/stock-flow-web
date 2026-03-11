<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useInventoryStore } from '@/stores/inventory'
import { getMaterialList } from '@/api/material'
import type { Material } from '@/types'
import type { InboundDTO } from '@/api/inventory'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const inventoryStore = useInventoryStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const materialLoading = ref(false)
const materials = ref<Material[]>([])

// 表单数据
const form = reactive<InboundDTO>({
  inboundNo: '', // 将在打开时生成或留空由后端处理
  materialCode: '',
  materialName: '',
  category: '',
  spec: '',
  unit: '',
  brand: '',
  quantity: 1,
  batchNo: '',
  expiryDate: '',
  mode: 'append',
})

// 选中的物料对象，用于填充其他字段
const selectedMaterialId = ref<number | undefined>(undefined)

// 验证规则
const rules = reactive<FormRules<InboundDTO>>({
  materialCode: [{ required: true, message: '请选择物料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  batchNo: [{ required: true, message: '请输入批号', trigger: 'blur' }],
  expiryDate: [{ required: true, message: '请选择有效期', trigger: 'change' }],
})

const normalizeDateString = (raw: string): string | null => {
  const text = raw.trim()
  if (!text) return null

  let yearStr = ''
  let monthStr = ''
  let dayStr = ''

  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(text)) {
    const parts = text.split(/[-/.]/)
    yearStr = parts[0] || ''
    monthStr = parts[1] || ''
    dayStr = parts[2] || ''
  } else {
    const digits = text.replace(/\D/g, '')
    if (digits.length === 8) {
      yearStr = digits.slice(0, 4)
      monthStr = digits.slice(4, 6)
      dayStr = digits.slice(6, 8)
    } else if (digits.length === 6) {
      yearStr = `20${digits.slice(0, 2)}`
      monthStr = digits.slice(2, 4)
      dayStr = digits.slice(4, 6)
    } else {
      return null
    }
  }

  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (year < 1900 || year > 2100) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null

  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

const handleExpiryBlur = () => {
  if (!form.expiryDate) return
  const normalized = normalizeDateString(form.expiryDate)
  if (!normalized) {
    ElMessage.warning('日期格式不正确，请输入如 2026-03-11 或 20260311')
    return
  }
  form.expiryDate = normalized
}

// 监听 visible 变化，初始化数据
watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      // 默认加载一些物料方便选择
      handleMaterialSearch('')
      // 生成默认入库单号 (可选，如果后端需要前端传)
      // form.inboundNo = `IB${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`
    }
  },
)

// 搜索物料
const handleMaterialSearch = async (query: string) => {
  materialLoading.value = true
  try {
    const res = await getMaterialList({ name: query, page: 1, page_size: 20 })
    if (Array.isArray(res.data)) {
      materials.value = res.data
    } else if (res.data && typeof res.data === 'object') {
      // 兼容可能的结构
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (res.data as any).items || (res.data as any).list || []
      materials.value = Array.isArray(list) ? list : []
    }
  } catch (error) {
    console.error('Failed to search materials:', error)
  } finally {
    materialLoading.value = false
  }
}

// 选择物料后填充字段
const handleMaterialChange = (id: number) => {
  const material = materials.value.find((m) => m.id === id)
  if (material) {
    form.materialCode = material.code
    form.materialName = material.name
    form.category = material.category
    form.spec = material.spec
    form.unit = material.unit
    form.brand = material.brand
  }
}

// 提交表单
const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      loading.value = true
      try {
        const success = await inventoryStore.addInventoryItem({ ...form })
        if (success) {
          emit('success')
          handleClose()
        }
      } catch (error) {
        // 错误通常在 store 或 axios 拦截器中处理，这里可以补充提示
        console.error(error)
      } finally {
        loading.value = false
      }
    } else {
      console.log('error submit!', fields)
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
  selectedMaterialId.value = undefined
  // 重置非表单绑定的冗余字段
  form.materialCode = ''
  form.materialName = ''
  form.category = ''
  form.spec = ''
  form.unit = ''
  form.brand = ''
  form.quantity = 1
  form.batchNo = ''
  form.expiryDate = ''
  // 重新生成单号
  form.inboundNo = `IB${new Date().toISOString().replace(/\D/g, '').slice(2, 14)}${Math.floor(Math.random() * 1000)}`
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="新增库存"
    width="600px"
    @close="handleClose"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" status-icon>
      <el-form-item label="入库单号" prop="inboundNo">
        <el-input v-model="form.inboundNo" placeholder="系统自动生成" disabled />
      </el-form-item>

      <el-form-item label="选择物料" prop="materialCode">
        <el-select
          v-model="selectedMaterialId"
          filterable
          remote
          reserve-keyword
          placeholder="请输入物料名称搜索"
          :remote-method="handleMaterialSearch"
          :loading="materialLoading"
          @change="handleMaterialChange"
          style="width: 100%"
        >
          <el-option
            v-for="item in materials"
            :key="item.id"
            :label="`${item.name} (${item.code})`"
            :value="item.id"
          >
            <span style="float: left">{{ item.name }}</span>
            <span
              style="
                float: right;
                color: var(--el-text-color-secondary);
                font-size: 13px;
                margin-left: 10px;
              "
            >
              {{ item.spec }} / {{ item.brand }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 选中物料后显示的详情 (只读) -->
      <div v-if="form.materialName" class="material-info">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料名称">
              <el-input v-model="form.materialName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料类型">
              <el-input v-model="form.category" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="form.spec" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="品牌/厂家">
              <el-input v-model="form.brand" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-form-item label="入库数量" prop="quantity">
        <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
      </el-form-item>

      <el-form-item label="内部批号" prop="batchNo">
        <el-input v-model="form.batchNo" placeholder="请输入生产批号" />
      </el-form-item>

      <el-form-item label="有效期至" prop="expiryDate">
        <el-date-picker
          v-model="form.expiryDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @blur="handleExpiryBlur"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit(formRef)">
          确定入库
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.material-info {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 18px;
}
</style>
