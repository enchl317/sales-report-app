// scripts/reset-monthly-targets.js
const mysql = require('mysql2/promise');

async function resetMonthlyTargets() {
  try {
    console.log('正在连接到 MySQL 服务器...');
    
    // 连接到数据库
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'enchl',
      password: process.env.DB_PASSWORD || '12345678',
      database: process.env.DB_NAME || 'sales_report_db',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('连接成功，正在清空 monthly_targets 表...');
    
    // 清空现有数据
    await connection.query('DELETE FROM monthly_targets WHERE year = 2026 AND month IN (1, 2, 3)');
    
    console.log('正在插入新的月度目标数据...');
    
    // 定义新的月度目标数据
    const monthlyTargets = [
      // 2026年1月目标
      [1, 2026, 1, 550000], // 南京东路第一食品
      [5, 2026, 1, 100000], // 五角场店(杨浦店)
      [6, 2026, 1, 100000], // 百联中环店(中环店)
      [2, 2026, 1, 80000],  // 三鑫世界商厦店
      [4, 2026, 1, 130000], // 全国土特产店
      [3, 2026, 1, 200000], // 汇联商厦店
      
      // 2026年2月目标
      [1, 2026, 2, 900000], // 南京东路第一食品
      [5, 2026, 2, 150000], // 五角场店(杨浦店)
      [6, 2026, 2, 150000], // 百联中环店(中环店)
      [2, 2026, 2, 100000], // 三鑫世界商厦店
      [4, 2026, 2, 150000], // 全国土特产店
      [3, 2026, 2, 300000], // 汇联商厦店
      
      // 2026年3月目标
      [1, 2026, 3, 430000], // 南京东路第一食品
      [5, 2026, 3, 130000], // 五角场店(杨浦店)
      [6, 2026, 3, 70000],  // 百联中环店(中环店)
      [2, 2026, 3, 60000],  // 三鑫世界商厦店
      [4, 2026, 3, 130000], // 全国土特产店
      [3, 2026, 3, 180000]  // 汇联商厦店
    ];
    
    // 插入新的月度目标数据
    for (const [storeId, year, month, targetAmount] of monthlyTargets) {
      await connection.query(`
        INSERT INTO monthly_targets (store_id, year, month, target_amount) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        target_amount = VALUES(target_amount),
        updated_at = CURRENT_TIMESTAMP
      `, [storeId, year, month, targetAmount]);
    }
    
    console.log('月度目标数据重置完成！');
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭。');
  } catch (error) {
    console.error('重置月度目标数据失败:', error);
    process.exit(1);
  }
}

resetMonthlyTargets();