// 检查用户门店关联关系
const mysql = require('mysql2/promise');

async function checkUserStores() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      port: 3306,
      database: 'sales_report_db'
    });
    
    console.log('查询用户ID为3的门店关联关系:');
    const result = await connection.query(`
      SELECT u.id, u.name, u.username, s.id as store_id, s.name as store_name, s.short_name 
      FROM users u 
      JOIN user_stores us ON u.id = us.user_id 
      JOIN stores s ON us.store_id = s.id 
      WHERE u.id = 3
    `);
    console.log(result[0]);
    
    console.log('\n查询所有用户门店关联关系:');
    const allResult = await connection.query(`
      SELECT u.id, u.name, u.username, s.id as store_id, s.name as store_name, s.short_name 
      FROM users u 
      JOIN user_stores us ON u.id = us.user_id 
      JOIN stores s ON us.store_id = s.id 
      ORDER BY u.id, s.id
    `);
    console.log(allResult[0]);
    
    await connection.end();
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkUserStores();