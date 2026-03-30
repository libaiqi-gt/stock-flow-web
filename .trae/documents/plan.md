# 领料与看板功能增强计划

## 1. Summary (总结)
对系统中的“领料”和“总览看板”模块进行功能增强。主要包括：在领料记录中增加查询条件与待审批记录的编辑功能；在库存列表支持多选和批量领料；在看板增加手动刷新按钮，并支持点击预警卡片跳转至对应的物料明细列表。对于目前后端尚未支持的接口（如编辑领料单），将采用 Mock 方案并在代码中添加清晰的注释。

## 2. Current State Analysis (现状分析)
- **领用记录** (`ConsumptionHistoryView.vue`)：目前仅有一个简单的分页表格，无法根据状态或名称过滤，也不支持对误填的“待审批(PENDING)”记录进行修改。
- **库存与领料** (`InventoryView.vue`)：仅支持单条操作，没有勾选框，当用户需要同时领用多种耗材时操作繁琐。
- **总览看板** (`DashboardView.vue`)：数据在组件挂载时加载一次，缺少手动刷新机制；顶部的预警统计卡片（安全库存、临期、过期）仅展示数字，无法点击溯源查看具体是哪些物料。
- **API 接口**：目前的 `applyOutbound` 仅支持单条；缺乏 `updateOutbound` 编辑接口。

## 3. Proposed Changes (建议更改)

### 3.1 领料记录查询与编辑
- **目标文件**: `src/views/ConsumptionHistoryView.vue`, `src/api/outbound.ts`
- **操作内容**:
  - 在 `ConsumptionHistoryView.vue` 顶部增加搜索栏，包含“物料名称/单号”输入框和“提交状态”下拉选择框。
  - 在表格的操作列，为 `status === 'PENDING'` 的数据增加“编辑”按钮。
  - 新增 `src/components/EditConsumeModal.vue` 组件，用于展示和修改已提交的领料信息。
  - 在 `outbound.ts` 中新增 `updateOutbound` Mock 接口。使用 `Promise.resolve` 模拟成功响应，并添加注释说明：`// TODO: 当前无编辑接口，此处为 Mock 数据，后续有接口支持后替换`。

### 3.2 多选与批量领料
- **目标文件**: `src/views/InventoryView.vue`, `src/stores/inventory.ts`
- **操作内容**:
  - 在 `InventoryView.vue` 表格中增加 `<el-table-column type="selection">` 以支持多选。
  - 在工具栏新增“批量领用”按钮，当勾选数量 `> 0` 时启用。
  - 新建 `src/components/BatchConsumeModal.vue` 组件：弹窗内列出所有选中的物料，支持顶部“一键批量填充（数量、用途等）”以及对每一行单独修改。
  - 在 `inventory.ts` 中新增 `batchConsumeItems` Action，内部通过 `Promise.all` 循环调用现有的 `applyOutbound` 接口实现批量提交（避免强依赖后端新增批量接口，且能直接工作）。

### 3.3 总览看板手动刷新与明细溯源
- **目标文件**: `src/views/DashboardView.vue`, `src/views/InventoryView.vue`
- **操作内容**:
  - 在 `DashboardView.vue` 的标题旁或工具栏区域新增“刷新”按钮，点击触发 `inventoryStore.fetchStats()`。
  - 为三个预警 `StatCard`（安全库存、临期、过期）添加 `cursor-pointer` 样式和点击事件。
  - 点击卡片时，使用 `router.push` 跳转到 `/inventory?filterType=xxx`（例如 `expired`, `warning`, `safety`）。
  - 修改 `InventoryView.vue` 的初始化逻辑：在 `onMounted` 阶段解析路由中的 `query.filterType`。若后端支持对应 status 查询则传入后端，若不支持（如低于安全库存）则在获取数据后使用 computed 属性在前端进行过滤展示。

## 4. Assumptions & Decisions (假设与决策)
- **编辑功能 Mock**：由于纯前端 Mock 在页面刷新后会还原，编辑提交后仅提示“修改成功（Mock）”并在当前组件刷新数据时可能恢复原状。这是基于“优先跑通流程，等待接口支持”的要求。
- **批量领料实现**：决定采用前端并发调用现有单条接口的方式实现，这样无需等待后端开发批量接口即可提升用户体验。
- **溯源过滤**：假设 `getInventoryList` 接口现有的 `status` 参数可以处理临期和过期，对于“低于安全库存”的特殊过滤，优先考虑在前端列表的 computed 中进行二次过滤，确保能够准确溯源。

## 5. Verification steps (验证步骤)
1. 在“全部领用记录”页面测试顶部过滤栏（状态、名称搜索）是否生效。
2. 在“全部领用记录”页面点击某条“待审批”记录的“编辑”按钮，修改并提交，确认控制台和弹窗显示 Mock 成功提示。
3. 在“库存总表”页面勾选多个物料，点击“批量领用”，统一填写数量并提交，确认多条领料记录正确生成。
4. 在“效期预警看板”点击“刷新”按钮，确认触发了网络请求和 Loading 动画。
5. 在“效期预警看板”点击“临期预警”卡片，验证是否跳转到了库存列表页面，且列表只展示了临期状态的物料。
