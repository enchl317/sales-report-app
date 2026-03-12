// scripts/update-db-structure.js
const mysql = require('mysql2/promise');

async function updateDbStructure() {
  try {
    console.log('正在连接到 MySQL 服务器...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      port: 3306,
      database: 'sales_report_db'
    });
    
    console.log('连接成功，正在更新表结构...');
    
    // 创建临时表来保存现有数据
    await connection.query(`
      CREATE TEMPORARY TABLE temp_sales_records AS 
      SELECT * FROM store_sales_records;
    `);
    
    // 删除原表
    await connection.query('DROP TABLE store_sales_records;');
    
    // 创建新表结构，将上报人信息存储为JSON数组
    await connection.query(`
      CREATE TABLE store_sales_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id INT NOT NULL,
        store_short_name VARCHAR(50) NOT NULL,
        report_date DATE NOT NULL,
        total_sales DECIMAL(10, 2) NOT NULL,
        meat_floss_sales DECIMAL(10, 2) DEFAULT 0,
        other_sales DECIMAL(10, 2) DEFAULT 0,
        reporter_ids JSON NOT NULL,
        reporter_names JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );
    `);
    
    // 从临时表中聚合数据并插入新表
    // 需要将相同门店和日期的记录合并
    const allRecords = await connection.query(`
      SELECT 
        store_id,
        store_short_name,
        report_date,
        total_sales,
        meat_floss_sales,
        other_sales,
        reporter_id,
        reporter_name
      FROM temp_sales_records
      ORDER BY store_id, report_date, id
    `);
    
    // 按门店和日期分组数据
    const groupedData = {};
    allRecords[0].forEach(record => {
      const key = `${record.store_id}-${record.report_date}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          store_id: record.store_id,
          store_short_name: record.store_short_name,
          report_date: record.report_date,
          total_sales: record.total_sales,
          meat_floss_sales: record.meat_floss_sales,
          other_sales: record.other_sales,
          reporter_ids: [],
          reporter_names: []
        };
      }
      
      // 添加上报人信息（避免重复）
      if (!groupedData[key].reporter_ids.includes(record.reporter_id)) {
        groupedData[key].reporter_ids.push(record.reporter_id);
        groupedData[key].reporter_names.push(record.reporter_name);
      }
    });
    
    // 插入聚合后的数据
    for (const key in groupedData) {
      const data = groupedData[key];
      await connection.query(`
        INSERT INTO store_sales_records 
        (store_id, store_short_name, report_date, total_sales, meat_floss_sales, other_sales, reporter_ids, reporter_names)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.store_id,
        data.store_short_name,
        data.report_date,
        data.total_sales,
        data.meat_floss_sales,
        data.other_sales,
        JSON.stringify(data.reporter_ids),
        JSON.stringify(data.reporter_names)
      ]);
    }
    
    console.log('数据库结构更新完成！');
    
    // 关闭连接
    await connection.end();
  } catch (error) {
    console.error('数据库结构更新失败:', error);
  }
}

updateDbStructure();