// test-multiple-reporters.js
const fetch = require('node-fetch');

async function testMultipleReporters() {
  console.log('测试多个上报人功能...');
  
  const testData = {
    storeId: 1,
    storeShortName: '南东店',
    reportDate: '2026-03-12',
    totalSales: 3000,
    meatFlossSales: 500,
    otherSales: 700,
    reporterIds: [1, 2]  // 多个上报人
  };
  
  console.log('发送数据:', testData);
  
  try {
    const response = await fetch('http://localhost:3000/api/sales-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应数据:', result);
    
    if (response.ok) {
      console.log('\n验证多上报人数据...');
      const getData = await fetch('http://localhost:3000/api/sales-report?storeId=1&startDate=2026-03-12&endDate=2026-03-12');
      const getResult = await getData.json();
      console.log('获取的数据:', getResult);
    }
  } catch (error) {
    console.error('请求错误:', error);
  }
}

testMultipleReporters();