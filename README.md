# 门店销售报告管理系统

版本: 1.5.0

## 项目概述

这是一个为门店运营人员设计的移动优先的销售报告管理系统，支持每日销售数据录入、历史数据查看、统计分析和月度目标管理。

## 功能特性

### 核心功能
- **用户认证**: 支持员工和管理员角色
- **门店管理**: 支持6家门店（南东店、杨浦店、中环店、三鑫店、全土店、汇联店）
- **销售数据录入**: 支持日常销售报告提交
- **数据可视化**: 年度销售汇总，按门店和月份查看
- **月度目标管理**: 设置和跟踪月度销售目标
- **达成率计算**: 自动计算销售目标达成率
- **员工工资管理**: 员工月度工资概览及详细统计
- **库存盘点管理**: 门店商品库存盘点记录及历史追踪
- **门店进货管理**: 门店商品进货单录入及历史追踪

### 技术栈
- **前端**: Next.js 14 (App Router)
- **后端**: Node.js + Next.js API Routes
- **数据库**: MySQL
- **样式**: Tailwind CSS
- **UI组件**: 原生HTML组件（优化性能）

## 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件：
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345678
DB_NAME=sales_report_db
DB_PORT=3306
```

### 3. 初始化数据库
```bash
npm run init-db
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 构建生产版本
```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/                    # Next.js 应用页面
│   ├── api/               # API 路由
│   ├── login/             # 登录页面
│   ├── sales-submit/      # 销售提交页面
│   ├── yearly-sales/      # 年度销售页面
│   ├── monthly-targets/   # 月度目标页面
│   └── ...
├── components/            # React 组件
├── lib/                   # 工具函数和库
└── ...
scripts/
├── init-db.js             # 数据库初始化脚本
└── update-db-v1.0.1.js    # 数据库更新脚本模板
```

## 页面功能

### 管理页面
- `/login` - 用户登录页面
- `/sales-submit` - 销售数据提交页面
- `/yearly-sales` - 年度销售数据汇总页面
- `/monthly-targets` - 月度目标管理页面
- `/monthly-target-management` - 门店月度销售阈值标准维护页面
- `/products` - 商品主档管理页面（查看、新建、编辑、删除商品）
- `/inventory-count` - 门店库存盘点页面（录入盘点数据、查看历史记录）
- `/store-purchase` - 门店进货单页面（录入进货数据、查看历史记录）
- `/store-purchase/detail/[id]` - 门店进货单详情页面
- `/store-transfer` - 门店调拨页面（录入调拨数据、查看历史记录）
- `/store-transfer/detail/[id]` - 门店调拨单详情页面
- `/monthly-threshold-management` - 门店月度销售阈值标准维护页面（新）
- `/employee-sales-stats` - 员工销售额统计页面
- `/employee-store-wage-management` - 员工门店销售工资百分比标准维护页面
- `/employee-wage-overview` - 员工月度工资总览页面（新）
- `/history` - 历史销售记录页面
- `/stats` - 销售数据统计分析页面
- `/debug` - 系统调试页面

## API 接口

- `POST /api/auth/login` - 用户登录
- `GET /api/stores` - 获取门店列表
- `POST /api/sales-report` - 提交销售报告
- `GET /api/yearly-sales` - 获取年度销售数据
- `GET/POST /api/monthly-targets` - 月度目标管理
- `GET/POST /api/store-thresholds` - 门店月度销售阈值标准管理
- `GET/POST /api/employee-store-wages` - 员工门店销售工资百分比标准管理
- `GET /api/employee-wage-summary` - 获取员工月度工资概览数据（新）
- `GET /api/users` - 获取用户列表
- `GET /api/store-sales` - 获取门店销售记录
- `GET/POST /api/inventory-count` - 门店库存盘点管理
- `GET/DELETE /api/inventory-count/[id]` - 获取/删除特定库存盘点记录
- `GET/POST /api/store-purchase` - 门店进货单管理
- `GET/DELETE /api/store-purchase/[id]` - 获取/删除特定进货单记录
- `GET/POST /api/store-transfer` - 门店调拨管理
- `GET/DELETE /api/store-transfer/[id]` - 获取/删除特定调拨单记录

## 部署

### 生产环境部署
1. 构建应用: `npm run build`
2. 启动应用: `npm start`
3. 使用 PM2 管理进程: `pm2 start npm --name "sales-report-app" -- start`

### 反向代理配置
推荐使用 Nginx 进行反向代理配置。

## 更新策略

### 数据库更新
- 新增数据库变更应使用独立的更新脚本
- 不得修改 `init-db.js` 初始化脚本
- 更新脚本命名规则: `update-db-vX.Y.Z.js`
- 新增 `employee_store_wage_standards` 表，用于存储员工门店销售工资百分比标准
- 提供 `scripts/init-employee-store-wage-table.js` 脚本初始化表结构和基础数据
- 新增 `store_monthly_thresholds` 表，用于存储门店月度销售阈值标准
- 提供 `scripts/init-store-thresholds-table.js` 脚本创建新表并初始化数据
- 提供 `scripts/reset-monthly-targets.js` 脚本重置月度销售目标数据
- 新增员工月度工资概览功能，包含相应的API接口和页面
- 新增库存盘点管理功能，包含 `inventory_counts` 和 `inventory_count_details` 表，提供完整的库存盘点记录和历史追踪功能
- 提供 `scripts/init-inventory-count.js` 脚本初始化库存盘点表结构
- 新增门店进货管理功能，包含 `store_purchases` 和 `store_purchase_details` 表，提供完整的进货单记录和历史追踪功能
- 提供 `scripts/init-store-purchase.js` 脚本初始化门店进货表结构
- 新增门店调拨管理功能，包含 `store_transfers` 和 `store_transfer_details` 表，提供完整的调拨单记录和历史追踪功能
- 提供 `scripts/init-store-transfer.js` 脚本初始化门店调拨表结构
- 调拨单据ID格式为 `MDDB+目标门店id+来源门店id+日期`

### 版本控制
- 遵循语义化版本控制 (SemVer)
- 重大变更需创建分支开发

## 维护

### 数据库备份
定期备份数据库以确保数据安全。

### 监控
使用 PM2 监控应用运行状态。

## 许可证

[MIT License](LICENSE)