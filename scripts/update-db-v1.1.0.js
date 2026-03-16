// scripts/update-db-v1.1.0.js
const mysql = require('mysql2/promise');

async function updateDatabase() {
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
    
    console.log('连接成功，正在更新杨浦店、中环店、南东店、三鑫店、全土店和汇联店销售上报人信息...');
    
    // 定义员工ID映射
    const employeeMap = {
      '陈娇娇': 6,
      '倪冬平': 4,
      '孙萍': 5,
      '陈云': 11,
      '陈讲艳': 2,
      '赵璟': 3,
      '范新平': 7,
      '梁庆珍': 12,
      '严伟华': 1,
      '李琴琴': 10,
      '谭辉': 9,
      '谭珍爱': 8
    };
    
    // 更新杨浦店（storeId=5）的销售记录
    const yangpuUpdates = [
      { date: '2026-03-01', employee: '陈娇娇' },
      { date: '2026-03-02', employee: '陈娇娇' },
      { date: '2026-03-03', employee: '陈娇娇' },
      { date: '2026-03-04', employee: '陈娇娇' },
      { date: '2026-03-05', employee: '陈娇娇' },
      { date: '2026-03-06', employee: '陈娇娇' },
      { date: '2026-03-07', employee: '陈娇娇' },
      { date: '2026-03-08', employee: '倪冬平' },
      { date: '2026-03-09', employee: '孙萍' },
      { date: '2026-03-10', employee: '陈云' },
      { date: '2026-03-11', employee: '孙萍' }
    ];
    
    // 更新中环店（storeId=6）的销售记录
    const zhonghuanUpdates = [
      { date: '2026-03-01', employee: '陈讲艳' },
      { date: '2026-03-02', employee: '陈讲艳' },
      { date: '2026-03-03', employee: '陈讲艳' },
      { date: '2026-03-04', employee: '陈讲艳' },
      { date: '2026-03-05', employee: '陈讲艳' },
      { date: '2026-03-06', employee: '陈讲艳' },
      { date: '2026-03-07', employee: '陈讲艳' },
      { date: '2026-03-08', employee: '陈讲艳' },
      { date: '2026-03-09', employee: '陈讲艳' },
      { date: '2026-03-10', employee: '陈讲艳' },
      { date: '2026-03-11', employee: '陈讲艳' }
    ];
    
    // 更新南东店（storeId=1）的销售记录
    const nandongUpdates = [
      { date: '2026-03-01', employees: ['赵璟', '倪冬平', '孙萍'] },
      { date: '2026-03-02', employees: ['赵璟', '孙萍', '范新平'] },
      { date: '2026-03-03', employees: ['倪冬平', '孙萍', '范新平'] },
      { date: '2026-03-04', employees: ['赵璟', '倪冬平', '范新平'] },
      { date: '2026-03-05', employees: ['赵璟', '倪冬平', '孙萍'] },
      { date: '2026-03-06', employees: ['赵璟', '孙萍', '范新平'] },
      { date: '2026-03-07', employees: ['倪冬平', '孙萍', '范新平'] },
      { date: '2026-03-08', employees: ['赵璟', '范新平', '陈娇娇'] },
      { date: '2026-03-09', employees: ['赵璟', '倪冬平', '范新平'] },
      { date: '2026-03-10', employees: ['赵璟', '范新平', '陈娇娇'] },
      { date: '2026-03-11', employees: ['赵璟', '倪冬平', '陈娇娇'] }
    ];
    
    // 更新三鑫店（storeId=2）的销售记录
    const sanxinUpdates = [
      { date: '2026-03-01', employee: '陈云' },
      { date: '2026-03-02', employee: '梁庆珍' },
      { date: '2026-03-03', employee: '陈云' },
      { date: '2026-03-04', employee: '梁庆珍' },
      { date: '2026-03-05', employee: '陈云' },
      { date: '2026-03-06', employee: '梁庆珍' },
      { date: '2026-03-07', employee: '陈云' },
      { date: '2026-03-08', employee: '梁庆珍' },
      { date: '2026-03-09', employee: '梁庆珍' },
      { date: '2026-03-10', employee: '梁庆珍' },
      { date: '2026-03-11', employee: '陈云' }
    ];
    
    // 更新全土店（storeId=4）的销售记录
    const quantuUpdates = [
      { date: '2026-03-01', employee: '严伟华' },
      { date: '2026-03-02', employee: '严伟华' },
      { date: '2026-03-03', employee: '严伟华' },
      { date: '2026-03-04', employee: '严伟华' },
      { date: '2026-03-05', employee: '严伟华' },
      { date: '2026-03-06', employee: '严伟华' },
      { date: '2026-03-07', employee: '严伟华' },
      { date: '2026-03-08', employee: '陈云' },
      { date: '2026-03-09', employee: '严伟华' },
      { date: '2026-03-10', employee: '严伟华' },
      { date: '2026-03-11', employee: '严伟华' }
    ];
    
    // 更新汇联店（storeId=3）的销售记录
    const huilianUpdates = [
      { date: '2026-03-01', employees: ['李琴琴', '谭辉'] },
      { date: '2026-03-02', employees: ['谭辉', '谭珍爱'] },
      { date: '2026-03-03', employees: ['李琴琴', '谭珍爱'] },
      { date: '2026-03-04', employees: ['李琴琴', '谭辉'] },
      { date: '2026-03-05', employees: ['谭辉', '谭珍爱'] },
      { date: '2026-03-06', employees: ['李琴琴', '谭珍爱'] },
      { date: '2026-03-07', employees: ['李琴琴', '谭辉'] },
      { date: '2026-03-08', employees: ['谭辉', '谭珍爱'] },
      { date: '2026-03-09', employees: ['李琴琴', '谭珍爱'] },
      { date: '2026-03-10', employees: ['李琴琴', '谭辉'] },
      { date: '2026-03-11', employees: ['谭辉', '谭珍爱'] }
    ];
    
    // 更新杨浦店的销售记录
    console.log('正在更新杨浦店销售上报人信息...');
    for (const update of yangpuUpdates) {
      const employeeId = employeeMap[update.employee];
      if (!employeeId) {
        console.error(`杨浦店 - 找不到员工: ${update.employee}`);
        continue;
      }
      
      // 更新store_sales_records表
      const result = await connection.query(`
        UPDATE store_sales_records 
        SET 
          reporter_ids = ?,
          reporter_names = ?
        WHERE store_id = 5 AND report_date = ?
      `, [
        JSON.stringify([employeeId]),
        JSON.stringify([update.employee]),
        update.date
      ]);
      
      if (result[0].affectedRows > 0) {
        console.log(`杨浦店 - 已更新 ${update.date} 的上报人为 ${update.employee}`);
      } else {
        console.log(`杨浦店 - 未找到 ${update.date} 的销售记录，跳过更新`);
      }
    }
    
    // 更新中环店的销售记录
    console.log('正在更新中环店销售上报人信息...');
    for (const update of zhonghuanUpdates) {
      const employeeId = employeeMap[update.employee];
      if (!employeeId) {
        console.error(`中环店 - 找不到员工: ${update.employee}`);
        continue;
      }
      
      // 更新store_sales_records表
      const result = await connection.query(`
        UPDATE store_sales_records 
        SET 
          reporter_ids = ?,
          reporter_names = ?
        WHERE store_id = 6 AND report_date = ?
      `, [
        JSON.stringify([employeeId]),
        JSON.stringify([update.employee]),
        update.date
      ]);
      
      if (result[0].affectedRows > 0) {
        console.log(`中环店 - 已更新 ${update.date} 的上报人为 ${update.employee}`);
      } else {
        console.log(`中环店 - 未找到 ${update.date} 的销售记录，跳过更新`);
      }
    }
    
    // 更新南东店的销售记录
    console.log('正在更新南东店销售上报人信息...');
    for (const update of nandongUpdates) {
      const employeeIds = update.employees.map(employee => employeeMap[employee]).filter(id => id !== undefined);
      const employeeNames = update.employees.filter(employee => employeeMap[employee] !== undefined);
      
      if (employeeIds.length === 0) {
        console.error(`南东店 - 找不到任何员工: ${update.employees.join(',')}`);
        continue;
      }
      
      // 更新store_sales_records表
      const result = await connection.query(`
        UPDATE store_sales_records 
        SET 
          reporter_ids = ?,
          reporter_names = ?
        WHERE store_id = 1 AND report_date = ?
      `, [
        JSON.stringify(employeeIds),
        JSON.stringify(employeeNames),
        update.date
      ]);
      
      if (result[0].affectedRows > 0) {
        console.log(`南东店 - 已更新 ${update.date} 的上报人为 ${update.employees.join(',')}`);
      } else {
        console.log(`南东店 - 未找到 ${update.date} 的销售记录，跳过更新`);
      }
    }
    
    // 更新三鑫店的销售记录
    console.log('正在更新三鑫店销售上报人信息...');
    for (const update of sanxinUpdates) {
      const employeeId = employeeMap[update.employee];
      if (!employeeId) {
        console.error(`三鑫店 - 找不到员工: ${update.employee}`);
        continue;
      }
      
      // 更新store_sales_records表
      const result = await connection.query(`
        UPDATE store_sales_records 
        SET 
          reporter_ids = ?,
          reporter_names = ?
        WHERE store_id = 2 AND report_date = ?
      `, [
        JSON.stringify([employeeId]),
        JSON.stringify([update.employee]),
        update.date
      ]);
      
      if (result[0].affectedRows > 0) {
        console.log(`三鑫店 - 已更新 ${update.date} 的上报人为 ${update.employee}`);
      } else {
        console.log(`三鑫店 - 未找到 ${update.date} 的销售记录，跳过更新`);
      }
    }
    
    // 更新全土店的销售记录
    console.log('正在更新全土店销售上报人信息...');
    for (const update of quantuUpdates) {
      const employeeId = employeeMap[update.employee];
      if (!employeeId) {
        console.error(`全土店 - 找不到员工: ${update.employee}`);
        continue;
      }
      
      // 更新store_sales_records表
      const result = await connection.query(`
        UPDATE store_sales_records 
        SET 
          reporter_ids = ?,
          reporter_names = ?
        WHERE store_id = 4 AND report_date = ?
      `, [
        JSON.stringify([employeeId]),
        JSON.stringify([update.employee]),
        update.date
      ]);
      
      if (result[0].affectedRows > 0) {
        console.log(`全土店 - 已更新 ${update.date} 的上报人为 ${update.employee}`);
      } else {
        console.log(`全土店 - 未找到 ${update.date} 的销售记录，跳过更新`);
      }
    }
    
    // 更新汇联店的销售记录
    console.log('正在更新汇联店销售上报人信息...');
    for (const update of huilianUpdates) {
      const employeeIds = update.employees.map(employee => employeeMap[employee]).filter(id => id !== undefined);
      const employeeNames = update.employees.filter(employee => employeeMap[employee] !== undefined);
      
      if (employeeIds.length === 0) {
        console.error(`汇联店 - 找不到任何员工: ${update.employees.join(',')}`);
        continue;
      }
      
      // 更新store_sales_records表
      const result = await connection.query(`
        UPDATE store_sales_records 
        SET 
          reporter_ids = ?,
          reporter_names = ?
        WHERE store_id = 3 AND report_date = ?
      `, [
        JSON.stringify(employeeIds),
        JSON.stringify(employeeNames),
        update.date
      ]);
      
      if (result[0].affectedRows > 0) {
        console.log(`汇联店 - 已更新 ${update.date} 的上报人为 ${update.employees.join(',')}`);
      } else {
        console.log(`汇联店 - 未找到 ${update.date} 的销售记录，跳过更新`);
      }
    }
    
    console.log('杨浦店、中环店、南东店、三鑫店、全土店和汇联店销售上报人信息更新完成！');
    
    // 关闭连接
    await connection.end();
  } catch (error) {
    console.error('数据库更新失败:', error);
    process.exit(1);
  }
}

updateDatabase();