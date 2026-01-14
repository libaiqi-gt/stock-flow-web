<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number | string
  description?: string
  type?: 'total' | 'warning' | 'expired'
  loading?: boolean
}>()

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const cardClass = computed(() => {
  return props.type ? props.type : 'default'
})
</script>

<template>
  <div class="stat-card" :class="cardClass">
    <div v-if="type === 'total'" class="bg-decoration-icon">
      <slot name="icon"></slot>
    </div>
    <div v-else class="bg-decoration"></div>

    <div class="card-header">
      <h3>{{ title }}</h3>
      <div class="icon-badge">
        <slot name="icon"></slot>
      </div>
    </div>

    <div class="stat-value" v-loading="loading">
      {{ formattedValue }}
    </div>

    <div class="stat-desc">
      <slot name="desc-prefix"></slot>
      {{ description }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid #f1f5f9;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    position: relative;
    z-index: 10;

    h3 {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .icon-badge {
      padding: 0.5rem;
      border-radius: 0.5rem;
      display: flex;
    }
  }

  .stat-value {
    font-size: 2.25rem;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 0.25rem;
    position: relative;
    z-index: 10;
    min-height: 2.25rem;
  }

  .stat-desc {
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    position: relative;
    z-index: 10;
  }

  // Variants
  &.total {
    border-color: #f1f5f9; // slate-100

    .bg-decoration-icon {
      position: absolute;
      right: 0;
      top: 0;
      padding: 1rem;
      opacity: 0.05;
      font-size: 6rem;
      transition: transform 0.5s;
      color: #1e293b;
      
      :deep(svg) {
        width: 1em;
        height: 1em;
      }
    }
    &:hover .bg-decoration-icon {
      transform: scale(1.1);
    }

    h3 {
      color: #64748b;
    }
    .icon-badge {
      background: #fef2f2;
      color: #dc2626;
    }
    &:hover .icon-badge {
      background: #dc2626;
      color: white;
      transition: background 0.3s;
    }
    .stat-value {
      color: #1e293b;
    }
    .stat-desc {
      color: #94a3b8;
    }
  }

  &.warning {
    border-color: #ffedd5; // orange-100
    box-shadow: 0 2px 10px -3px rgba(249, 115, 22, 0.1);

    .bg-decoration {
      position: absolute;
      right: -1.5rem;
      top: -1.5rem;
      width: 8rem;
      height: 8rem;
      background: #fff7ed;
      border-radius: 50%;
      opacity: 0.5;
      transition: transform 0.5s;
    }
    &:hover .bg-decoration {
      transform: scale(1.1);
    }

    h3 {
      color: #ea580c;
      opacity: 0.8;
    }
    .icon-badge {
      background: #ffedd5;
      color: #ea580c;
    }
    .stat-value {
      color: #ea580c;
    }
    .stat-desc {
      color: rgba(234, 88, 12, 0.7);
    }
  }

  &.expired {
    border-color: #fee2e2; // red-100
    box-shadow: 0 2px 10px -3px rgba(220, 38, 38, 0.1);

    .bg-decoration {
      position: absolute;
      right: -1.5rem;
      top: -1.5rem;
      width: 8rem;
      height: 8rem;
      background: #fef2f2;
      border-radius: 50%;
      opacity: 0.5;
      transition: transform 0.5s;
    }
    &:hover .bg-decoration {
      transform: scale(1.1);
    }

    h3 {
      color: #b91c1c;
      opacity: 0.8;
    }
    .icon-badge {
      background: #fee2e2;
      color: #b91c1c;
    }
    .stat-value {
      color: #b91c1c;
    }
    .stat-desc {
      color: rgba(185, 28, 28, 0.7);
    }
  }
}
</style>
