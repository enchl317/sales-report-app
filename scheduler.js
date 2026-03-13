// scheduler.js - 独立的定时任务调度器
const cron = require('node-cron');
const axios = require('axios'); // 需要安装: npm install axios

// 每天22:25执行 - 生成Excel报告
cron.schedule('25 22 * * *', async () => {
  console.log(`开始执行Excel生成定时任务: ${new Date().toISOString()}`);
  
  try {
    // 调用API生成日销售报告和月销售汇总报告
    const response = await axios.post('http://localhost:3000/api/run-scheduled-task');
    console.log('Excel生成定时任务执行成功:', response.data);
  } catch (error) {
    console.error('Excel生成定时任务执行失败:', error.message);
  }
}, {
  timezone: "Asia/Shanghai" // 设置为中国时区
});

// 每天22:30执行 - 发送邮件
cron.schedule('30 22 * * *', async () => {
  console.log(`开始执行邮件发送定时任务: ${new Date().toISOString()}`);
  
  try {
    // 调用API发送邮件
    const response = await axios.post('http://localhost:3000/api/send-email');
    console.log('邮件发送定时任务执行成功:', response.data);
  } catch (error) {
    console.error('邮件发送定时任务执行失败:', error.message);
  }
}, {
  timezone: "Asia/Shanghai" // 设置为中国时区
});

console.log('定时任务调度器已启动，将在每天22:25生成Excel，22:30发送邮件');