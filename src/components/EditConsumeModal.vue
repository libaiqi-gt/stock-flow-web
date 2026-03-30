<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { OutboundItem } from '@/types'
import { updateOutbound } from '@/api/outbound'

const props = defineProps<{
  modelValue: boolean
  outboundItem: OutboundItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  quantity: 1,
  purpose: '',
  opening_date: '',
  remarks: '',
})

const rules = reactive<FormRules>({
  quantity: [
    { required: true, message: '请输入领用数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' },
  ],
  purpose: [{ required: true, message: '请选择或输入用途', trigger: 'change' }],
  opening_date: [{ required: true, message: '请选择开封日期', trigger: 'change' }],
})

// 用途选项
const purposeOptions = ['日常实验', '项目研发', '仪器维护', '教学演示', '其他']

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.outboundItem) {
      form.quantity = props.outboundItem.quantity || 1
      form.purpose = props.outboundItem.purpose || ''
      // 处理日期格式，保留 YYYY-MM-DD
      if (props.outboundItem.opening_date) {
        form.opening_date = props.outboundItem.opening_date.substring(0, 10)
      } else {
        form.opening_date = ''
      }
      form.remarks = props.outboundItem.remarks || ''
    } else {
      formRef.value?.resetFields()
    }
  },
)

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!props.outboundItem?.id) return

      submitting.value = true
      try {
        await updateOutbound(props.outboundItem.id, {
          quantity: form.quantity,
          purpose: form.purpose,
          // 接口要求 YYYY-MM-DD
          opening_date: form.opening_date,
          remarks: form.remarks,
        })

        ElMessage.success('修改成功')
        emit('success')
        handleClose()
      } catch (error) {
        console.error('Update failed:', error)
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
    title="编辑领用申请"
    width="500px"
    @update:model-value="handleClose"
    destroy-on-close
  >
    <div class="material-info" v-if="outboundItem">
      <div class="info-item">
        <span class="label">物料名称:</span>
        <span class="value">{{ outboundItem.inventory?.material?.name }}</span>
      </div>
      <div class="info-item">
        <span class="label">规格:</span>
        <span class="value">{{ outboundItem.inventory?.material?.spec || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="label">当前库存:</span>
        <span class="value highlight">
          {{ outboundItem.inventory?.current_qty }} {{ outboundItem.inventory?.material?.unit }}
        </span>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="consume-form"
    >
      <el-form-item label="领用数量" prop="quantity">
        <el-input-number
          v-model="form.quantity"
          :min="1"
          :max="outboundItem?.inventory?.current_qty || 999999"
          controls-position="right"
          style="width: 100%"
        />
        <div class="form-tip">不能超过当前库存数量</div>
      </el-form-item>

      <el-form-item label="用途" prop="purpose">
        <el-select
          v-model="form.purpose"
          placeholder="请选择用途"
          allow-create
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="item in purposeOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="开封日期" prop="opening_date">
        <el-date-picker
          v-model="form.opening_date"
          type="date"
          placeholder="选择开封日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
        <div class="form-tip">此日期用于计算开封后效期</div>
      </el-form-item>

      <el-form-item label="备注" prop="remarks">
        <el-input
          v-model="form.remarks"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息（选填）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存修改
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.material-info {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      color: #64748b;
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;

      &.highlight {
        color: #0ea5e9;
      }
    }
  }
}

.consume-form {
  .form-tip {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.4;
    margin-top: 4px;
  }
}
</style>
