# 接口对接与使用指南

本文档详细说明了前端如何对接后端 API，包括配置、调用方式及测试方法。

## 1. 接口配置

### 1.1 Base URL
接口基础路径在 `src/utils/http.ts` 中并未硬编码，而是直接使用相对路径（如 `/auth/login`）。
在开发环境 (`vite.config.ts`) 中通常配置 Proxy 代理到后端服务器。

### 1.2 认证机制
- **方式**: Bearer Token
- **流程**:
  1. 用户登录成功后，后端返回 JWT Token。
  2. 前端将 Token 存储在 `localStorage`。
  3. `src/utils/http.ts` 中的拦截器会自动在每个请求头中添加 `Authorization: Bearer <token>`。
  4. 遇到 401 错误时，会自动清除 Token 并跳转至登录页。

## 2. 接口清单

| 模块 | 功能 | 方法 | 路径 | 对应函数 |
|------|------|------|------|----------|
| **Auth** | 用户登录 | POST | `/auth/login` | `loginApi` |
| **Inventory** | 库存列表 | GET | `/api/v1/inventory` | `getInventoryList` |
| **Inventory** | 耗材入库 | POST | `/api/v1/inventory/inbound` | `importInventory` |
| **Outbound** | 领用申请 | POST | `/api/v1/outbound/apply` | `consumeInventory` |
| **Outbound** | 我的领用 | GET | `/api/v1/outbound/my` | `getOutboundList` |
| **Outbound** | 标记完结 | PUT | `/api/v1/outbound/{id}/status` | `markOutboundFinished` |

## 3. 调用示例

```typescript
import { getInventoryList, consumeInventory } from '@/api/inventory';

// 1. 查询库存
const fetchList = async () => {
  try {
    const res = await getInventoryList({ page: 1, status: 1 });
    console.log('库存列表:', res.data);
  } catch (err) {
    console.error('查询失败:', err);
  }
};

// 2. 领用耗材
const handleConsume = async (item) => {
  try {
    await consumeInventory({
      inventory_id: item.id,
      quantity: 5,
      purpose: '实验消耗'
    });
    console.log('领用成功');
  } catch (err) {
    // 错误已由拦截器统一提示，此处可处理额外逻辑
  }
};
```

## 4. 接口联调测试

为了方便验证接口连通性，项目内置了测试脚本。

### 运行方式
1. 打开浏览器控制台 (F12)。
2. 确保 `main.ts` 中已挂载测试函数 (可选，默认未挂载，需手动导入执行或使用以下代码)：
   ```typescript
   // 临时在 main.ts 中添加
   import { runApiTests } from '@/api/test-api';
   (window as any).runApiTests = runApiTests;
   ```
3. 在控制台输入 `await runApiTests()` 并回车。
4. 查看控制台输出的测试报告。

### 测试内容
- 模拟登录 (User: admin)
- 获取库存列表
- 模拟领用操作 (自动选取第一条库存)
- 获取领用记录
- 标记领用记录为“已用完”

## 5. 常见问题

- **404 Not Found**: 请检查后端服务是否启动，以及 Vite Proxy 是否配置正确。
- **401 Unauthorized**: Token 过期或无效，请重新登录。
- **CORS Error**: 跨域问题，请确保后端配置了 CORS 或开发环境 Proxy 正确。
