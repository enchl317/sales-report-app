# 门店销售报告系统

这是一个为6家门店运营人员设计的移动端销售报告系统，用于上报每日销售数据。

## 功能特性

- 用户身份认证
- 门店选择功能
- 销售数据填报（总销售额、现金、刷卡、线上销售额、顾客数量等）
- 历史报告查看
- 数据统计与分析（管理员/经理可见）
- 移动端友好界面

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Ant Design Mobile
- Node.js (后端API)

## 环境要求

- Node.js (版本 18 或更高)
- npm 或 yarn

## 安装和运行

### 安装 Node.js

如果尚未安装 Node.js，请按以下步骤操作：

**对于 macOS（使用 Homebrew）：**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

**从官网下载：**
访问 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本并安装。

**验证安装：**
```bash
node --version
npm --version
```

### 开发环境

1. 安装依赖：
```bash
npm install
# 或
yarn install
```

2. 启动开发服务器：
```bash
npm run dev
# 或
yarn dev
```

3. 访问 http://localhost:3000

### 生产环境

1. 构建应用：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm start
```

## 用户账户

系统预设了以下账户：

**门店员工账户：**
- store1_staff / password123
- store2_staff / password123
- ...
- store6_staff / password123

**门店经理账户：**
- store1_manager / password123
- store2_manager / password123
- ...
- store6_manager / password123

**管理员账户：**
- admin / password123

## 页面说明

- `/` - 销售报告填报页面
- `/history` - 历史报告查看页面
- `/stats` - 数据统计页面（仅管理员和经理可见）
- `/login` - 登录页面

## API 接口

- `POST /api/sales-report` - 提交销售报告
- `GET /api/sales-report` - 获取销售报告列表
- `DELETE /api/sales-report` - 删除销售报告

## 项目结构

```
src/
├── app/                 # 页面路由
│   ├── login/           # 登录页面
│   ├── history/         # 历史页面
│   └── stats/           # 统计页面
├── components/          # 可复用组件
├── lib/                 # 工具函数
└── app/                 # 全局布局和样式
```

## 部署

### 部署到 Vercel

1. 将项目推送到 GitHub/GitLab/Bitbucket
2. 在 Vercel 中导入项目
3. 点击部署

### 本地部署

```bash
npm install
npm run build
npm start
```

## 注意事项

- 当前版本使用内存存储，生产环境需替换为真实数据库
- 密码验证为简化实现，生产环境需使用加密存储
- 用户权限控制为演示目的，生产环境需完善权限体系