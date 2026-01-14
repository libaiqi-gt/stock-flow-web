<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { User, Lock, ArrowRight, WarningFilled, ElementPlus } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  username: '',
  password: '',
})
const loginError = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    loginError.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  try {
    await userStore.login(loginForm.username, loginForm.password)
    router.push('/')
  } catch {
    loginError.value = '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration-1"></div>
    <div class="bg-decoration-2"></div>
    <div class="noise-texture"></div>

    <!-- 动态光斑 -->
    <div class="light-spots">
      <div class="spot spot-1"></div>
      <div class="spot spot-2"></div>
    </div>

    <div class="login-card-wrapper">
      <div class="login-card">
        <!-- 卡片光条 -->
        <div class="card-highlight"></div>

        <div class="logo-area">
          <div class="logo-wrapper">
            <div class="logo-glow"></div>
            <div class="logo-icon">
              <el-icon :size="40" color="#ef4444"><ElementPlus /></el-icon>
            </div>
          </div>
        </div>

        <div class="title-area">
          <h2>LIMS <span class="highlight">Pro</span></h2>
          <p>实验室智能资源管理中台</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>登录账号</label>
            <div class="input-wrapper">
              <el-icon class="input-icon"><User /></el-icon>
              <input type="text" v-model="loginForm.username" placeholder="请输入用户名" />
            </div>
          </div>

          <div class="form-group">
            <label>登录密码</label>
            <div class="input-wrapper">
              <el-icon class="input-icon"><Lock /></el-icon>
              <input type="password" v-model="loginForm.password" placeholder="••••••••" />
            </div>
          </div>

          <div v-if="loginError" class="error-message">
            <el-icon><WarningFilled /></el-icon>
            {{ loginError }}
          </div>

          <button type="submit" :disabled="loading" class="submit-btn">
            <div class="btn-highlight"></div>
            <span>进入系统</span>
            <el-icon><ArrowRight /></el-icon>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc; // slate-50
  position: relative;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: #1e293b; // slate-800

  .bg-decoration-1 {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% -20%, #ffe4e6, transparent 60%);
  }
  .bg-decoration-2 {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle at 100% 100%, #fff1f2, transparent 50%);
  }
  .noise-texture {
    position: absolute;
    inset: 0;
    opacity: 0.4;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
    pointer-events: none;
  }
}

.light-spots {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;

  .spot {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: pulse 4s infinite;
  }
  .spot-1 {
    top: 15%;
    left: 10%;
    width: 18rem;
    height: 18rem;
    background-color: rgba(252, 165, 165, 0.2); // red-300
  }
  .spot-2 {
    bottom: 15%;
    right: 10%;
    width: 500px;
    height: 500px;
    background-color: rgba(253, 164, 175, 0.2); // rose-300
    animation-delay: 1s;
    animation-duration: 5s;
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

.login-card-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 28rem; // max-w-md
  padding: 1.5rem;
}

.login-card {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 20px 40px -15px rgba(225, 29, 72, 0.15);
  position: relative;
  overflow: hidden;

  .card-highlight {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #f87171, transparent);
    opacity: 0.3;
  }
}

.logo-area {
  display: flex;
  justify-content: center;
  margin-bottom: 2.5rem;

  .logo-wrapper {
    position: relative;

    .logo-glow {
      position: absolute;
      inset: -1rem;
      background: linear-gradient(to right, #fecaca, #fecdd3);
      border-radius: 50%;
      filter: blur(16px);
      opacity: 0.6;
    }
    .logo-icon {
      position: relative;
      padding: 1rem;
      background: white;
      border-radius: 50%;
      border: 1px solid #fef2f2;
      box-shadow: 0 10px 15px -3px rgba(254, 226, 226, 1);
    }
  }
}

.title-area {
  text-align: center;
  margin-bottom: 2.5rem;

  h2 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;

    .highlight {
      color: #ef4444;
    }
  }
  p {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.025em;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .form-group {
    label {
      display: block;
      font-size: 0.625rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-left: 0.25rem;
    }
    .input-wrapper {
      position: relative;
      transition: all 0.3s;

      .input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        transition: color 0.3s;
      }

      &:focus-within .input-icon {
        color: #ef4444;
      }

      input {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 2.75rem;
        background-color: rgba(255, 255, 255, 0.8);
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        color: #1e293b;
        font-size: 1rem;
        outline: none;
        transition: all 0.3s;

        &::placeholder {
          color: #94a3b8;
        }

        &:focus {
          border-color: rgba(239, 68, 68, 0.5);
          background-color: white;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }
      }
    }
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #dc2626;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  animation: pulse 2s infinite;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(to right, #dc2626, #e11d48);
  color: white;
  font-weight: 700;
  border-radius: 0.75rem;
  border: none;
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  margin-top: 0.5rem;

  &:hover {
    transform: scale(1.02);
    background: linear-gradient(to right, #ef4444, #f43f5e);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-highlight {
    position: absolute;
    inset: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(100%);
    transition: transform 0.3s;
  }

  &:hover .btn-highlight {
    transform: translateY(0);
  }
}
</style>
