// scripts/init-store-transfer.js
const mysql = require('mysql2/promise');

async function initStoreTransferTable() {
  try {
    console.log('正在连接到 MySQL 服务器...');
    
    // 首先连接到 MySQL 服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'enchl',
      password: process.env.DB_PASSWORD || '12345678',
      port: parseInt(process.env.DB_PORT) || 3306
    });
    
    console.log('连接成功，正在选择数据库...');
    
    // 选择数据库
    await connection.query('USE sales_report_db;');
    
    console.log('开始创建门店调拨表...');
    
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS store_transfers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_id VARCHAR(50) NOT NULL UNIQUE COMMENT '调拨单据ID',
      created_date DATE NOT NULL COMMENT '调拨单创建日期',
      target_store_id INT NOT NULL COMMENT '目标门店ID',
      target_store_name VARCHAR(100) COMMENT '目标门店名称',
      source_store_id INT NOT NULL COMMENT '来源门店ID',
      source_store_name VARCHAR(100) COMMENT '来源门店名称',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_store_date (target_store_id, created_date),
      INDEX idx_document_id (document_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店调拨表';
    `;
    
    await connection.query(createTableSQL);
    console.log('门店调拨表创建成功！');
    
    console.log('开始创建门店调拨明细表...');
    
    const createDetailTableSQL = `
    CREATE TABLE IF NOT EXISTS store_transfer_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transfer_id INT NOT NULL COMMENT '调拨单ID',
      product_id INT NOT NULL COMMENT '商品ID',
      product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
      transfer_quantity DECIMAL(10,4) NOT NULL DEFAULT 0 COMMENT '调拨数量',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_transfer_id (transfer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店调拨明细表';
    `;
    
    await connection.query(createDetailTableSQL);
    console.log('门店调拨明细表创建成功！');
    
    console.log('门店调拨表初始化完成！');
    
    await connection.end();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('初始化门店调拨表失败:', error);
    throw error;
  }
}

// 运行初始化
initStoreTransferTable()
  .then(() => {
    console.log('初始化完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('初始化失败:', error);
    process.exit(1);
  });