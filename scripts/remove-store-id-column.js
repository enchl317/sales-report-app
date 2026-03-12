// scripts/remove-store-id-column.js
const mysql = require('mysql2/promise');

async function removeStoreIdColumn() {
  try {
    console.log('正在连接到 MySQL 服务器...');
    
    // 连接到 MySQL 服务器
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      port: 3306,
      database: 'sales_report_db'
    });
    
    console.log('连接成功，正在删除 users 表中的 store_id 列...');
    
    // 删除 store_id 列（如果存在）
    try {
      await connection.query('ALTER TABLE users DROP COLUMN store_id;');
      console.log('store_id 列已成功删除');
    } catch (err) {
      // 如果列不存在，会抛出错误，这很正常
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('store_id 列可能已不存在');
      } else {
        console.error('删除 store_id 列时出错:', err.message);
      }
    }
    
    // 验证列已被删除
    const [columns] = await connection.query('DESCRIBE users;');
    console.log('\n当前 users 表结构:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}${col.Null === 'YES' ? ' NULL' : ''}${col.Key ? ` ${col.Key}` : ''}`);
    });
    
    // 关闭连接
    await connection.end();
    console.log('\n数据库更新完成！');
  } catch (error) {
    console.error('数据库更新失败:', error);
  }
}

removeStoreIdColumn();