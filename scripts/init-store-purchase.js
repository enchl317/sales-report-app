// scripts/init-store-purchase.js
const mysql = require('mysql2/promise');

async function initStorePurchase() {
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
    
    console.log('正在创建门店进货相关表...');
    
    // 创建门店进货主表
    // 单据ID格式：MDJH+门店id+日期，如MDJH0120260406
    await connection.query(`
      CREATE TABLE IF NOT EXISTS store_purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id VARCHAR(50) NOT NULL UNIQUE COMMENT '进货单据ID (格式: MDJH+门店id+日期)',
        created_date DATE NOT NULL COMMENT '进货单创建日期',
        store_id INT NOT NULL COMMENT '门店ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        INDEX idx_store_date (store_id, created_date),
        INDEX idx_document_id (document_id)
      );
    `);
    
    // 创建门店进货明细表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS store_purchase_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_purchase_id INT NOT NULL COMMENT '门店进货主表ID',
        product_id INT NOT NULL COMMENT '商品ID',
        product_name VARCHAR(255) NOT NULL COMMENT '商品名称',
        purchase_quantity DECIMAL(10,4) DEFAULT 0.0000 COMMENT '进货数量',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (store_purchase_id) REFERENCES store_purchases(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        UNIQUE KEY unique_store_purchase_product (store_purchase_id, product_id),
        INDEX idx_store_purchase (store_purchase_id),
        INDEX idx_product (product_id)
      );
    `);
    
    console.log('门店进货表创建成功！');
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('门店进货表初始化失败:', error);
  }
}

initStorePurchase();