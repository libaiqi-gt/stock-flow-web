<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  DataBoard,
  Box,
  Files,
  User,
  SwitchButton,
  Bell,
  Goods,
  Stamp,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeTab = computed(() => {
  if (route.path.includes('dashboard')) return 'dashboard'
  if (route.path.includes('material')) return 'material'
  if (route.path.includes('inventory')) return 'inventory'
  if (route.path.includes('approval')) return 'approval'
  if (route.path.includes('outbound')) return 'outbound'
  return 'dashboard'
})

const pageTitle = computed(() => route.meta.title || '系统')

const allNavItems = [
  { id: 'dashboard', label: '总览看板', icon: DataBoard, path: '/dashboard' },
  { id: 'material', label: '物料管理', icon: Goods, path: '/material' },
  { id: 'inventory', label: '库存管理', icon: Box, path: '/inventory' },
  { id: 'approval', label: '审批管理', icon: Stamp, path: '/approval', role: 'Admin' },
  { id: 'outbound', label: '领出记录', icon: Files, path: '/outbound' },
]

const navItems = computed(() => {
  return allNavItems.filter((item) => {
    if (item.role && userStore.currentUser?.role !== item.role) return false
    return true
  })
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo-area">
        <div class="logo-box">L</div>
        <span class="logo-text">LIMS System</span>
      </div>

      <nav class="nav-menu">
        <div class="nav-header">功能导航</div>
        <router-link
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          class="nav-item"
          :class="{ active: activeTab === item.id }"
        >
          <el-icon :size="18" class="nav-icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
          <div v-if="activeTab === item.id" class="active-indicator"></div>
        </router-link>
      </nav>

      <div class="user-panel">
        <div class="user-card">
          <div class="user-info">
            <div class="avatar">
              <el-icon><User /></el-icon>
            </div>
            <div class="info-text">
              <div class="username">
                {{ userStore.currentUser?.real_name || userStore.currentUser?.username }}
              </div>
              <div class="role">
                {{ userStore.roleName }}
              </div>
            </div>
          </div>
          <button @click="handleLogout" class="logout-btn">
            <el-icon><SwitchButton /></el-icon> 退出系统
          </button>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="page-info">
          <div class="icon-box" :class="activeTab">
            <el-icon v-if="activeTab === 'dashboard'"><DataBoard /></el-icon>
            <el-icon v-if="activeTab === 'material'"><Goods /></el-icon>
            <el-icon v-if="activeTab === 'inventory'"><Box /></el-icon>
            <el-icon v-if="activeTab === 'approval'"><Stamp /></el-icon>
            <el-icon v-if="activeTab === 'outbound'"><Files /></el-icon>
          </div>
          <h1>{{ pageTitle }}</h1>
        </div>

        <div class="top-actions">
          <div class="status-badge">
            <span class="dot-wrapper">
              <span class="dot-ping"></span>
              <span class="dot"></span>
            </span>
            系统在线
          </div>
          <div class="notification">
            <el-icon :size="20"><Bell /></el-icon>
            <span class="badge"></span>
          </div>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style lang="less" scoped>
.layout-container {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #1e293b;
}

.sidebar {
  width: 16rem; // 64
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 20;
  border-right: 1px solid #e2e8f0;

  .logo-area {
    height: 4rem;
    padding: 0 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .logo-box {
      width: 2rem;
      height: 2rem;
      background: linear-gradient(to bottom right, #ef4444, #e11d48);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
    }
    .logo-text {
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
  }

  .nav-menu {
    flex: 1;
    padding: 1rem;

    .nav-header {
      font-size: 0.625rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
      padding: 0 0.75rem;
      margin-top: 1rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      color: #64748b;
      text-decoration: none;
      transition: all 0.2s;
      position: relative;
      margin-bottom: 0.25rem;

      &:hover {
        background-color: #f8fafc;
        color: #0f172a;
      }

      &.active {
        background-color: #fef2f2;
        color: #dc2626;

        .nav-icon {
          color: #ef4444;
        }
      }

      .nav-icon {
        color: #94a3b8;
        transition: color 0.2s;
      }

      &:hover .nav-icon {
        color: #ef4444;
      }

      .active-indicator {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 0.25rem;
        height: 1.5rem;
        background-color: #ef4444;
        border-top-right-radius: 9999px;
        border-bottom-right-radius: 9999px;
      }
    }
  }

  .user-panel {
    padding: 1rem;
    margin: 0.5rem;

    .user-card {
      background-color: #f8fafc;
      border-radius: 0.75rem;
      padding: 1rem;
      border: 1px solid #f1f5f9;

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;

        .avatar {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 9999px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          color: #94a3b8;
        }

        .info-text {
          overflow: hidden;

          .username {
            font-size: 0.875rem;
            font-weight: 700;
            truncate: true;
          }
          .role {
            font-size: 0.625rem;
            color: #ef4444;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
        }
      }

      .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: #64748b;
        padding: 0.5rem;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          color: #dc2626;
          background: white;
          border-color: #f1f5f9;
        }
      }
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.top-bar {
  height: 4rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 10;

  .page-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .icon-box {
      padding: 0.5rem;
      border-radius: 0.5rem;
      display: flex;

      &.dashboard {
        background: #fef2f2;
        color: #dc2626;
      }
      &.inventory {
        background: #fff1f2;
        color: #e11d48;
      }
      &.outbound {
        background: #fff7ed;
        color: #ea580c;
      }
    }

    h1 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
    }
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;

      .dot-wrapper {
        position: relative;
        display: flex;
        width: 0.5rem;
        height: 0.5rem;

        .dot-ping {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          background: #34d399;
          opacity: 0.75;
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .dot {
          position: relative;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: #10b981;
        }
      }
    }

    .notification {
      position: relative;
      cursor: pointer;
      color: #94a3b8;
      padding: 0.5rem;
      border-radius: 9999px;
      transition: all 0.2s;

      &:hover {
        color: #475569;
        background: #f1f5f9;
      }

      .badge {
        position: absolute;
        top: 0.375rem;
        right: 0.375rem;
        width: 0.5rem;
        height: 0.5rem;
        background: #ef4444;
        border-radius: 9999px;
        border: 2px solid white;
      }
    }
  }
}

.content-area {
  flex: 1;
  overflow: auto;
  padding: 2rem;
  scroll-behavior: smooth;
}

@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
