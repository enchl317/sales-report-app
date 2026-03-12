// scripts/test-db-connection.ts
import { query } from '../src/lib/db';

async function testConnection() {
  try {
    console.log('正在测试数据库连接...');
    
    // 查询门店数量
    const result = await query('SELECT COUNT(*) as count FROM stores');
    console.log('数据库连接成功！门店数量:', result[0].count);
    
    // 查询所有门店
    const stores = await query('SELECT * FROM stores');
    console.log('门店列表:', stores);
    
    // 查询用户数量
    const userResult = await query('SELECT COUNT(*) as count FROM users');
    console.log('用户数量:', userResult[0].count);
    
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

testConnection();