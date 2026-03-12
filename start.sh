#!/bin/bash

# 门店销售报告系统启动脚本

echo "门店销售报告系统启动脚本"
echo "========================="

# 检查 Node.js 是否已安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    echo "请先安装 Node.js (版本 18 或更高)"
    echo "访问 https://nodejs.org/ 下载安装"
    exit 1
fi

# 检查 npm 是否已安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装"
    echo "请先安装 Node.js (包含 npm)"
    exit 1
fi

# 显示版本信息
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"
echo ""

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "错误: package.json 文件不存在"
    echo "请确保在项目根目录中运行此脚本"
    exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "检测到首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "依赖安装失败"
        exit 1
    fi
    echo "依赖安装完成"
    echo ""
fi

# 询问运行模式
echo "请选择运行模式:"
echo "1) 开发模式 (热重载，调试信息)"
echo "2) 生产模式 (优化性能，无调试信息)"
echo ""
read -p "请输入选择 (1 或 2): " mode

case $mode in
    1)
        echo "启动开发服务器..."
        echo "访问 http://localhost:3000"
        npm run dev
        ;;
    2)
        echo "构建生产版本..."
        npm run build
        if [ $? -eq 0 ]; then
            echo "启动生产服务器..."
            echo "访问 http://localhost:3000"
            npm start
        else
            echo "构建失败"
            exit 1
        fi
        ;;
    *)
        echo "无效选择，使用默认开发模式"
        echo "启动开发服务器..."
        echo "访问 http://localhost:3000"
        npm run dev
        ;;
esac