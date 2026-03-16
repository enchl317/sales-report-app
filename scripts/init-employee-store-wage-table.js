// scripts/init-employee-store-wage-table.js
const mysql = require('mysql2/promise');

async function initEmployeeStoreWageTable() {
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
    
    console.log('连接成功，正在创建 employee_store_wage_standards 表...');
    
    // 创建员工门店工资标准表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employee_store_wage_standards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        store_id INT NOT NULL,
        wage_percentage_above_target DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT '高于销售目标的工资百分比标准',
        wage_percentage_below_target DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT '低于销售目标的工资百分比标准',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_employee_store (employee_id, store_id),
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    
    console.log('employee_store_wage_standards 表创建成功！');
    
    // 初始化员工门店工资百分比数据
    console.log('正在初始化员工门店工资百分比数据...');
    
    // 获取所有员工和门店
    const usersResult = await connection.query('SELECT id, name FROM users');
    const users = usersResult[0];
    
    const storesResult = await connection.query('SELECT id, name FROM stores');
    const stores = storesResult[0];
    
    // 定义门店ID映射
    const storeMap = {};
    stores.forEach(store => {
      storeMap[store.name] = store.id;
    });
    
    // 初始化每个员工对于各门店的工资百分比
    for (const user of users) {
      // 1. 南东店 (storeId=1)
      if (storeMap['南京东路第一食品']) {
        await connection.query(`
          INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          wage_percentage_above_target = VALUES(wage_percentage_above_target),
          wage_percentage_below_target = VALUES(wage_percentage_below_target),
          updated_at = CURRENT_TIMESTAMP
        `, [user.id, storeMap['南京东路第一食品'], 13, 12]);
      }
      
      // 2. 杨浦店 (storeId=5)
      if (storeMap['五角场店']) {
        await connection.query(`
          INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          wage_percentage_above_target = VALUES(wage_percentage_above_target),
          wage_percentage_below_target = VALUES(wage_percentage_below_target),
          updated_at = CURRENT_TIMESTAMP
        `, [user.id, storeMap['五角场店'], 13, 12]);
      }
      
      // 3. 三鑫店 (storeId=2)
      if (storeMap['三鑫世界商厦店']) {
        await connection.query(`
          INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          wage_percentage_above_target = VALUES(wage_percentage_above_target),
          wage_percentage_below_target = VALUES(wage_percentage_below_target),
          updated_at = CURRENT_TIMESTAMP
        `, [user.id, storeMap['三鑫世界商厦店'], 12, 12]);
      }
      
      // 4. 中环店 (storeId=6)
      if (storeMap['百联中环店']) {
        await connection.query(`
          INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          wage_percentage_above_target = VALUES(wage_percentage_above_target),
          wage_percentage_below_target = VALUES(wage_percentage_below_target),
          updated_at = CURRENT_TIMESTAMP
        `, [user.id, storeMap['百联中环店'], 16.5, 15.5]);
      }
      
      // 5. 汇联店 (storeId=3)
      if (storeMap['汇联商厦店']) {
        await connection.query(`
          INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          wage_percentage_above_target = VALUES(wage_percentage_above_target),
          wage_percentage_below_target = VALUES(wage_percentage_below_target),
          updated_at = CURRENT_TIMESTAMP
        `, [user.id, storeMap['汇联商厦店'], 16, 14]);
      }
      
      // 6. 全土店 (storeId=4)
      if (storeMap['全国土特产店']) {
        await connection.query(`
          INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
          wage_percentage_above_target = VALUES(wage_percentage_above_target),
          wage_percentage_below_target = VALUES(wage_percentage_below_target),
          updated_at = CURRENT_TIMESTAMP
        `, [user.id, storeMap['全国土特产店'], 17.5, 17.5]);
      }
    }
    
    // 7. 覆盖更新谭珍爱对于中环门店的工资百分比
    const tanzaUser = users.find(user => user.name === '谭珍爱');
    if (tanzaUser && storeMap['百联中环店']) {
      await connection.query(`
        INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        wage_percentage_above_target = VALUES(wage_percentage_above_target),
        wage_percentage_below_target = VALUES(wage_percentage_below_target),
        updated_at = CURRENT_TIMESTAMP
      `, [tanzaUser.id, storeMap['百联中环店'], 15, 15]);
    }
    
    // 8. 覆盖更新谭辉对于全土门店的工资百分比
    const tanhUser = users.find(user => user.name === '谭辉');
    if (tanhUser && storeMap['全国土特产店']) {
      await connection.query(`
        INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        wage_percentage_above_target = VALUES(wage_percentage_above_target),
        wage_percentage_below_target = VALUES(wage_percentage_below_target),
        updated_at = CURRENT_TIMESTAMP
      `, [tanhUser.id, storeMap['全国土特产店'], 15, 15]);
    }
    
    // 9. 覆盖更新陈云对于全土门店的工资百分比
    const chenyUser = users.find(user => user.name === '陈云');
    if (chenyUser && storeMap['全国土特产店']) {
      await connection.query(`
        INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        wage_percentage_above_target = VALUES(wage_percentage_above_target),
        wage_percentage_below_target = VALUES(wage_percentage_below_target),
        updated_at = CURRENT_TIMESTAMP
      `, [chenyUser.id, storeMap['全国土特产店'], 15, 15]);
    }
    
    // 10. 覆盖更新陈云对于杨浦门店的工资百分比
    if (chenyUser && storeMap['五角场店']) {
      await connection.query(`
        INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        wage_percentage_above_target = VALUES(wage_percentage_above_target),
        wage_percentage_below_target = VALUES(wage_percentage_below_target),
        updated_at = CURRENT_TIMESTAMP
      `, [chenyUser.id, storeMap['五角场店'], 12, 12]);
    }
    
    console.log('员工门店工资百分比数据初始化完成！');
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭。');
  } catch (error) {
    console.error('初始化 employee_store_wage_standards 表失败:', error);
    process.exit(1);
  }
}

initEmployeeStoreWageTable();