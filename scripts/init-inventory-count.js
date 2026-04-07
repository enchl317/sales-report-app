// scripts/init-inventory-count.js
const mysql = require('mysql2/promise');

async function initInventoryCount() {
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
    
    console.log('正在创建库存盘点相关表...');
    
    // 创建库存盘点主表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_counts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id VARCHAR(50) NOT NULL UNIQUE COMMENT '盘点单据ID (格式: KCPD+门店id+日期)',
        created_date DATE NOT NULL COMMENT '盘点单创建日期',
        store_id INT NOT NULL COMMENT '门店ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        INDEX idx_store_date (store_id, created_date),
        INDEX idx_document_id (document_id)
      );
    `);
    
    // 创建库存盘点明细表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_count_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_count_id INT NOT NULL COMMENT '库存盘点主表ID',
        product_id INT NOT NULL COMMENT '商品ID',
        product_name VARCHAR(255) NOT NULL COMMENT '商品名称',
        counted_quantity DECIMAL(10,2) DEFAULT 0.00 COMMENT '盘点数量',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_count_id) REFERENCES inventory_counts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        UNIQUE KEY unique_inventory_product (inventory_count_id, product_id),
        INDEX idx_inventory_count (inventory_count_id),
        INDEX idx_product (product_id)
      );
    `);
    
    console.log('库存盘点表创建成功！');
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('库存盘点表初始化失败:', error);
  }
}

initInventoryCount();