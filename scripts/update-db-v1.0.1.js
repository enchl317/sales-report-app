// scripts/update-db-v1.0.1.js
// 数据库更新脚本模板 - 用于 v1.0.0 之后的数据库变更
const mysql = require('mysql2/promise');

async function updateDatabase() {
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
    
    console.log('连接成功，开始执行数据库更新...');
    
    // 示例：添加新字段或表的更新脚本
    // 注意：这里只添加增量更新，不会影响现有的数据
    
    /*
    // 示例更新操作：
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
    `);
    
    console.log('字段更新完成');
    
    // 示例：创建新表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    console.log('新表创建完成');
    */
    
    console.log('数据库更新完成！');
    
    // 关闭连接
    await connection.end();
    
  } catch (error) {
    console.error('数据库更新失败:', error);
  }
}

updateDatabase();