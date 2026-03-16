// scripts/init-monthly-targets-table.js
const mysql = require('mysql2/promise');

async function initMonthlyTargetsTable() {
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
    
    console.log('连接成功，正在创建或更新 monthly_targets 表...');
    
    // 创建月度目标表（如果不存在）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS monthly_targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id INT NOT NULL,
        year INT NOT NULL,
        month INT NOT NULL,
        target_amount DECIMAL(10, 2) NOT NULL COMMENT '月度销售阈值标准',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_store_year_month (store_id, year, month),
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    
    console.log('monthly_targets 表创建/更新成功！');
    
    // 插入2026年各门店的月度目标数据
    console.log('正在插入2026年各门店的月度目标数据...');
    
    // 定义各门店的月度目标
    const storeTargets = {
      1: 400000, // 南东店 (storeId=1)
      5: 100000, // 杨浦店 (storeId=5)
      2: 0,      // 三鑫店 (storeId=2)
      6: 70000,  // 中环店 (storeId=6)
      3: 200000, // 汇联店 (storeId=3)
      4: 0       // 全土店 (storeId=4)
    };
    
    // 为每个门店插入12个月的数据
    for (const [storeId, targetAmount] of Object.entries(storeTargets)) {
      for (let month = 1; month <= 12; month++) {
        await connection.query(`
          INSERT INTO monthly_targets (store_id, year, month, target_amount) 
          VALUES (?, 2026, ?, ?)
          ON DUPLICATE KEY UPDATE 
          target_amount = VALUES(target_amount),
          updated_at = CURRENT_TIMESTAMP
        `, [parseInt(storeId), month, targetAmount]);
      }
    }
    
    console.log('2026年各门店的月度目标数据插入完成！');
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭。');
  } catch (error) {
    console.error('初始化 monthly_targets 表失败:', error);
    process.exit(1);
  }
}

initMonthlyTargetsTable();