// scripts/update-db-v1.4.1-offline-sale.js
// 更新数据库结构，添加 offline_sale 字段到 products 表

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function updateDatabase() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sales_report'
    });

    console.log('正在连接数据库...');

    // 检查 offline_sale 字段是否已存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'offline_sale'
    `, [process.env.DB_NAME || 'sales_report']);

    if (columns.length === 0) {
      // 添加 offline_sale 字段
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN offline_sale TINYINT(1) DEFAULT 1 COMMENT '是否线下售卖：1-是，0-否'
      `);
      console.log('✅ offline_sale 字段已成功添加到 products 表');
    } else {
      console.log('ℹ️ offline_sale 字段已存在，无需添加');
    }

    // 更新现有记录的 offline_sale 为 1（默认为可线下售卖）
    const [result] = await connection.query(`
      UPDATE products SET offline_sale = 1 WHERE offline_sale IS NULL
    `);
    console.log(`✅ 已更新 ${result.affectedRows} 条记录的 offline_sale 值`);

    console.log('\n✅ 数据库更新完成！');
    
  } catch (error) {
    console.error('❌ 数据库更新失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行更新
updateDatabase();