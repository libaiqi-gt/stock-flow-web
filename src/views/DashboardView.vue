<script setup lang="ts">
import { onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { Box, Warning, CircleClose, TrendCharts } from '@element-plus/icons-vue'

const inventoryStore = useInventoryStore()

onMounted(() => {
  inventoryStore.fetchStats()
  inventoryStore.fetchInventory() // Needed for stats computed from inventory list
})
</script>

<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <!-- 库存总批次 -->
      <div class="stat-card total">
        <div class="bg-decoration-icon"><Box /></div>
        <div class="card-header">
          <h3>库存总批次</h3>
          <div class="icon-badge">
            <el-icon><Box /></el-icon>
          </div>
        </div>
        <div class="stat-value">{{ inventoryStore.stats.totalItems }}</div>
        <div class="stat-desc">当前系统在管物资批次</div>
      </div>

      <!-- 临期预警 -->
      <div class="stat-card warning">
        <div class="bg-decoration"></div>
        <div class="card-header">
          <h3>临期预警 (60天)</h3>
          <div class="icon-badge">
            <el-icon><Warning /></el-icon>
          </div>
        </div>
        <div class="stat-value">{{ inventoryStore.stats.warningItems }}</div>
        <div class="stat-desc">
          <span class="dot-pulse"></span>
          建议优先领用 (FEFO)
        </div>
      </div>

      <!-- 已过期 -->
      <div class="stat-card expired">
        <div class="bg-decoration"></div>
        <div class="card-header">
          <h3>已过期</h3>
          <div class="icon-badge">
            <el-icon><CircleClose /></el-icon>
          </div>
        </div>
        <div class="stat-value">{{ inventoryStore.stats.expiredItems }}</div>
        <div class="stat-desc">
          <span class="dot"></span>
          请立即冻结并报废
        </div>
      </div>
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
        <div class="trend-badge">
          <el-icon><TrendCharts /></el-icon>
          <span>同比上涨 12.5%</span>
        </div>
      </div>

      <div class="chart-body">
        <div
          v-for="(item, index) in inventoryStore.usageTrend"
          :key="index"
          class="chart-bar-wrapper"
        >
          <div class="bar-container">
            <div class="tooltip">{{ item.value }} 件</div>
            <div class="bar" :class="item.color" :style="{ height: `${item.value}%` }">
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
}

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

    .dot-pulse {
      display: inline-block;
      width: 0.375rem;
      height: 0.375rem;
      background: #f97316;
      border-radius: 50%;
      animation: pulse 2s infinite;
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

    .dot {
      display: inline-block;
      width: 0.375rem;
      height: 0.375rem;
      background: #dc2626;
      border-radius: 50%;
    }
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
    }
  }

  .chart-body {
    height: 14rem;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0 1rem;

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
