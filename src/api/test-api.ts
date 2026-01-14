import { loginApi } from './auth'
import {
  getInventoryList,
  consumeInventory,
  getOutboundList,
  markOutboundFinished,
} from './inventory'

/**
 * 接口联调测试脚本
 * 使用方法:
 * 1. 在 main.ts 中引入: `import { runApiTests } from '@/api/test-api'; (window as any).runApiTests = runApiTests;`
 * 2. 在浏览器控制台执行: `await runApiTests()`
 */
export const runApiTests = async () => {
  console.group('🚀 开始接口联调测试')

  try {
    // 1. 测试登录
    console.group('1. Testing Login')
    const loginRes = await loginApi({ username: 'admin', password: 'password123' })
    console.log('✅ Login Success:', loginRes)
    if (!loginRes.data.token) throw new Error('Token not received')
    localStorage.setItem('token', loginRes.data.token)
    console.groupEnd()

    // 2. 测试库存查询
    console.group('2. Testing Inventory List')
    const invRes = await getInventoryList({ page: 1, page_size: 5 })
    console.log('✅ Inventory List:', invRes)
    console.groupEnd()

    // 3. 测试入库 (如果允许)
    // console.group('3. Testing Import')
    // const importRes = await importInventory({
    //   materialCode: 'TEST001',
    //   materialName: 'Test Material',
    //   category: 'Test',
    //   spec: '10g',
    //   unit: 'bottle',
    //   brand: 'TestBrand',
    //   inboundNo: 'IN' + Date.now(),
    //   batchNo: 'B' + Date.now(),
    //   quantity: 100,
    //   expiryDate: '2026-12-31',
    //   mode: 'append'
    // })
    // console.log('✅ Import Success:', importRes)
    // console.groupEnd()

    // 4. 测试领用 (需要有效的 inventory_id)
    if (invRes.data && invRes.data.length > 0) {
      console.group('4. Testing Consume')
      const item = invRes.data[0]!
      const consumeRes = await consumeInventory({
        inventory_id: item.id!,
        quantity: 1,
        purpose: 'Test Purpose',
      })
      console.log('✅ Consume Success:', consumeRes)
      console.groupEnd()
    } else {
      console.warn('⚠️ Skip Consume Test: No inventory items found')
    }

    // 5. 测试领用记录
    console.group('5. Testing Outbound List')
    const outRes = await getOutboundList()
    console.log('✅ Outbound List:', outRes)
    console.groupEnd()

    // 6. 测试标记完成
    if (outRes.data && outRes.data.length > 0) {
      console.group('6. Testing Mark Finished')
      const record = outRes.data[0]!
      const finishRes = await markOutboundFinished(record.id!)
      console.log('✅ Mark Finished Success:', finishRes)
      console.groupEnd()
    } else {
      console.warn('⚠️ Skip Mark Finished Test: No outbound records found')
    }

    console.log('🎉 所有接口测试完成!')
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    console.groupEnd()
  }
}
