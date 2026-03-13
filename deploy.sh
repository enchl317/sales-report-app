#!/bin/bash

echo "开始部署销售报表系统..."

# 设置邮箱认证信息
export EMAIL_USER='enchl_25hour@163.com'
export EMAIL_PASS='XQbaeW4whU5pe9Vm'  # 邮箱授权码
export EMAIL_TO='shurongfund@163.com,enchl_25hour@163.com'

# 检查必需的环境变量
if [ -z "$EMAIL_USER" ] || [ -z "$EMAIL_PASS" ]; then
    echo "错误: 请设置 EMAIL_USER 和 EMAIL_PASS 环境变量"
    echo "例如: export EMAIL_USER='your_email@163.com'"
    echo "      export EMAIL_PASS='your_auth_code'"
    exit 1
fi

# 设置默认收件人，如果没有设置的话
EMAIL_TO="${EMAIL_TO:-'shurongfund@163.com,enchl_25hour@163.com'}"

# 安装依赖
echo "安装依赖..."
npm install

# 清理缓存并重新构建
echo "清理缓存并重新构建..."
rm -rf .next
npm run build

# 停止现有服务
echo "停止现有服务..."
pkill -f "next start" || echo "没有运行的网页服务"
pkill -f "node scheduler.js" || echo "没有运行的调度器"

# 等待服务停止
sleep 5

# 启动网页服务（带环境变量）
echo "启动网页服务..."
nohup env PORT=3000 EMAIL_USER="$EMAIL_USER" EMAIL_PASS="$EMAIL_PASS" EMAIL_TO="$EMAIL_TO" npm start > web.log 2>&1 &
WEB_PID=$!
echo "网页服务PID: $WEB_PID"

# 启动定时任务调度器
echo "启动定时任务调度器..."
sleep 10  # 等待网页服务启动
nohup node scheduler.js > scheduler.log 2>&1 &
SCHEDULER_PID=$!
echo "调度器PID: $SCHEDULER_PID"

# 等待服务完全启动
sleep 10

# 验证服务
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✓ 网页服务启动成功"
    echo "✓ 定时任务调度器启动成功"
    echo "✓ 邮件发送功能已配置"
    echo "服务信息:"
    echo "  - 网页服务: http://your-server-ip:3000/"
    echo "  - 定时任务: 每天22:25自动生成Excel报告"
    echo "  - 邮件功能: 可通过 /api/send-email 发送邮件"
    echo "  - 收件人: $EMAIL_TO"
    echo "  - 日志文件: web.log, scheduler.log"
    echo "  - 进程ID: 网页($WEB_PID), 调度器($SCHEDULER_PID)"
else
    echo "✗ 服务启动失败，请检查 web.log 和 scheduler.log 文件"
fi