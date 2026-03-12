// 测试销售上报API
const { request } = require('http');
const { URL } = require('url');

async function testSalesSubmission() {
  try {
    console.log('测试销售上报API...');
    
    const testData = {
      storeId: 1,  // 南京东路第一食品
      storeShortName: '南东店',
      reportDate: new Date().toISOString().split('T')[0], // 今天的日期
      totalSales: 1000.50,
      meatFlossSales: 200.00,
      otherSales: 300.00,
      reporterIds: [1]  // 严伟华
    };
    
    console.log('发送数据:', testData);
    
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

testSalesSubmission();