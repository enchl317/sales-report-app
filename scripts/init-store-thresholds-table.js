// scripts/init-store-thresholds-table.js
const mysql = require('mysql2/promise');

async function initStoreThresholdsTable() {
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
    
    console.log('连接成功，正在创建 store_monthly_thresholds 表...');
    
    // 创建门店月度销售阈值标准表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS store_monthly_thresholds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id INT NOT NULL,
        year INT NOT NULL,
        month INT NOT NULL,
        threshold_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '月度销售阈值标准金额',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_store_year_month (store_id, year, month),
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    
    console.log('store_monthly_thresholds 表创建成功！');
    
    // 初始化2026年各门店的月度销售阈值标准数据
    console.log('正在初始化2026年各门店的月度销售阈值标准数据...');
    
    // 定义各门店的月度销售阈值标准
    const storeThresholds = {
      1: 400000, // 南东店 (storeId=1)
      5: 100000, // 杨浦店 (storeId=5)
      2: 0,      // 三鑫店 (storeId=2)
      6: 70000,  // 中环店 (storeId=6)
      3: 200000, // 汇联店 (storeId=3)
      4: 0       // 全土店 (storeId=4)
    };
    
    // 为每个门店插入12个月的数据
    for (const [storeId, thresholdAmount] of Object.entries(storeThresholds)) {
      for (let month = 1; month <= 12; month++) {
        await connection.query(`
          INSERT INTO store_monthly_thresholds (store_id, year, month, threshold_amount) 
          VALUES (?, 2026, ?, ?)
          ON DUPLICATE KEY UPDATE 
          threshold_amount = VALUES(threshold_amount),
          updated_at = CURRENT_TIMESTAMP
        `, [parseInt(storeId), month, thresholdAmount]);
      }
    }
    
    console.log('2026年各门店的月度销售阈值标准数据初始化完成！');
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭。');
  } catch (error) {
    console.error('初始化 store_monthly_thresholds 表失败:', error);
    process.exit(1);
  }
}

initStoreThresholdsTable();