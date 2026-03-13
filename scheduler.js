// scheduler.js - 独立的定时任务调度器
const cron = require('node-cron');
const axios = require('axios'); // 需要安装: npm install axios

// 每天22:25执行
cron.schedule('25 22 * * *', async () => {
  console.log(`开始执行定时任务: ${new Date().toISOString()}`);
  
  try {
    // 调用API生成日销售报告和月销售汇总报告
    const response = await axios.post('http://localhost:3000/api/run-scheduled-task');
    console.log('定时任务执行成功:', response.data);
  } catch (error) {
    console.error('定时任务执行失败:', error.message);
  }
}, {
  timezone: "Asia/Shanghai" // 设置为中国时区
});

console.log('定时任务调度器已启动，将在每天22:25执行');