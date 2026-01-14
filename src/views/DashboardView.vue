<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { Box, Warning, CircleClose, TrendCharts, Top, Bottom } from '@element-plus/icons-vue'
import StatCard from '@/components/StatCard.vue'

const inventoryStore = useInventoryStore()

// 计算图表最大值，用于归一化高度
const maxTrendValue = computed(() => {
  if (inventoryStore.usageTrend.length === 0) return 100
  return Math.max(...inventoryStore.usageTrend.map((item) => item.value)) || 100
})

// 计算同比趋势
const trendInfo = computed(() => {
  const trend = inventoryStore.usageTrend
  if (trend.length < 2) return { value: '0%', isUp: true }

  const lastMonth = trend[trend.length - 1]?.value || 0
  const prevMonth = trend[trend.length - 2]?.value || 0

  if (prevMonth === 0) return { value: '100%', isUp: true }

  const diff = lastMonth - prevMonth
  const percentage = Math.abs((diff / prevMonth) * 100).toFixed(1)

  return {
    value: `${percentage}%`,
    isUp: diff >= 0,
  }
})

onMounted(() => {
  inventoryStore.fetchStats()
})
</script>

<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <!-- 库存总批次 -->
      <StatCard
        title="库存总批次"
        :value="inventoryStore.stats.totalItems"
        description="当前系统在管物资批次"
        type="total"
        :loading="inventoryStore.loading"
      >
        <template #icon>
          <el-icon><Box /></el-icon>
        </template>
      </StatCard>

      <!-- 临期预警 -->
      <StatCard
        title="临期预警"
        :value="inventoryStore.stats.warningItems"
        description="建议优先领用 (FEFO)"
        type="warning"
        :loading="inventoryStore.loading"
      >
        <template #icon>
          <el-icon><Warning /></el-icon>
        </template>
        <template #desc-prefix>
          <span class="dot-pulse"></span>
        </template>
      </StatCard>

      <!-- 已过期 -->
      <StatCard
        title="已过期"
        :value="inventoryStore.stats.expiredItems"
        description="请立即冻结并报废"
        type="expired"
        :loading="inventoryStore.loading"
      >
        <template #icon>
          <el-icon><CircleClose /></el-icon>
        </template>
        <template #desc-prefix>
          <span class="dot"></span>
        </template>
      </StatCard>
    </div>

    <!-- 历史图表 -->
    <div class="chart-section">
      <div class="chart-header">
        <div class="title-group">
          <div class="icon-box">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div>
            <h3>历史耗材消耗趋势</h3>
            <p>近半年领用出库数据分析</p>
          </div>
        </div>
        <div class="trend-badge" :class="{ 'trend-down': !trendInfo.isUp }">
          <el-icon v-if="trendInfo.isUp"><Top /></el-icon>
          <el-icon v-else><Bottom /></el-icon>
          <span>环比{{ trendInfo.isUp ? '上涨' : '下降' }} {{ trendInfo.value }}</span>
        </div>
      </div>

      <div class="chart-body">
        <div v-if="inventoryStore.loading" class="chart-loading">加载中...</div>
        <div v-else-if="inventoryStore.usageTrend.length === 0" class="chart-empty">暂无数据</div>
        <div
          v-else
          v-for="(item, index) in inventoryStore.usageTrend"
          :key="index"
          class="chart-bar-wrapper"
        >
          <div class="bar-container">
            <div class="tooltip">{{ item.value }} 件</div>
            <div
              class="bar"
              :class="item.color"
              :style="{ height: `${(item.value / maxTrendValue) * 100}%` }"
            >
              <div class="bar-highlight"></div>
            </div>
          </div>
          <span class="label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2.5rem;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }

  .dot-pulse {
    display: inline-block;
    width: 0.375rem;
    height: 0.375rem;
    background: #f97316;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .dot {
    display: inline-block;
    width: 0.375rem;
    height: 0.375rem;
    background: #dc2626;
    border-radius: 50%;
  }
}

.chart-section {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;

    .title-group {
      display: flex;
      align-items: center;
      gap: 1rem;

      .icon-box {
        padding: 0.75rem;
        background: #fff1f2;
        color: #e11d48;
        border-radius: 0.75rem;
        display: flex;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.125rem;
      }
      p {
        font-size: 0.75rem;
        font-weight: 500;
        color: #94a3b8;
      }
    }

    .trend-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #059669; // emerald-600
      background: #ecfdf5; // emerald-50
      border: 1px solid #d1fae5;
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;

      &.trend-down {
        color: #dc2626; // red-600
        background: #fef2f2; // red-50
        border-color: #fee2e2; // red-100
      }
    }
  }

  .chart-body {
    height: 14rem;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0 1rem;
    position: relative;

    .chart-loading,
    .chart-empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.8);
      z-index: 10;
    }

    .chart-bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      height: 100%;
      justify-content: flex-end;
      cursor: pointer;

      &:hover {
        .bar {
          opacity: 1;
          box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .label {
          color: #475569;
        }
        .tooltip {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .bar-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        position: relative;
      }

      .tooltip {
        position: absolute;
        bottom: 100%;
        margin-bottom: 0.5rem;
        background: #1e293b;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.375rem 0.75rem;
        border-radius: 0.5rem;
        opacity: 0;
        transform: translateY(0.5rem);
        transition: all 0.3s;
        white-space: nowrap;

        &::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1e293b;
        }
      }

      .bar {
        width: 100%;
        max-width: 3.5rem;
        border-top-left-radius: 0.75rem;
        border-top-right-radius: 0.75rem;
        opacity: 0.8;
        transition: all 0.3s;
        position: relative;

        .bar-highlight {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.3);
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
        }

        // Color mapping classes (need to match data)
        &.bg-rose-300 {
          background-color: #fda4af;
        }
        &.bg-red-400 {
          background-color: #f87171;
        }
        &.bg-rose-400 {
          background-color: #fb7185;
        }
        &.bg-red-500 {
          background-color: #ef4444;
        }
        &.bg-rose-500 {
          background-color: #f43f5e;
        }
        &.bg-red-600 {
          background-color: #dc2626;
        }
      }

      .label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
        transition: color 0.3s;
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
