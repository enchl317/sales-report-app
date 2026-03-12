// 测试重复提交功能
const { request } = require('http');

async function testDuplicateSubmission() {
  try {
    console.log('测试重复提交功能...');
    
    // 第二次提交相同日期和门店的数据
    const testData = {
      storeId: 1,  // 南京东路第一食品
      storeShortName: '南东店',
      reportDate: '2026-03-11', // 使用相同的日期
      totalSales: 2000.00,  // 不同的销售额
      meatFlossSales: 400.00,
      otherSales: 600.00,
      reporterIds: [2]  // 陈讲艳
    };
    
    console.log('发送重复提交数据:', testData);
    
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sales-report',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = request(options, (res) => {
      console.log('响应状态:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('响应数据:', result);
          
          // 查询数据库验证是否覆盖了旧数据
          setTimeout(async () => {
            const mysql = require('mysql2/promise');
            const connection = await mysql.createConnection({
              host: 'localhost',
              user: 'root',
              password: '12345678',
              port: 3306,
              database: 'sales_report_db'
            });
            
            console.log('\\n验证重复提交结果:');
            const result = await connection.query('SELECT * FROM store_sales_records WHERE store_id = 1 AND report_date = "2026-03-11" ORDER BY created_at DESC LIMIT 5');
            console.log(result[0]);
            
            await connection.end();
          }, 1000);
        } catch (e) {
          console.log('响应数据（非JSON）:', data);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('请求错误:', e);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('请求失败:', error);
  }
}

testDuplicateSubmission();