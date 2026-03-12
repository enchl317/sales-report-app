# 门店销售报告系统 - 本地部署指南

## 系统要求

- 操作系统：Windows 7+, macOS 10.12+, 或 Linux
- Node.js: 版本 18 或更高
- npm: 版本 8 或更高
- 内存：至少 2GB RAM
- 磁盘空间：至少 500MB 可用空间

## 安装步骤

### 1. 安装 Node.js

#### 方法一：使用包管理器（推荐）

**macOS (使用 Homebrew):**
```bash
# 安装 Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL/Fedora:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo -E bash -
sudo dnf install -y nodejs
```

#### 方法二：从官网下载

1. 访问 [Node.js 官方网站](https://nodejs.org/)
2. 下载 LTS (长期支持) 版本
3. 运行安装程序并按照向导完成安装

### 2. 验证安装

打开终端或命令提示符，运行以下命令：

```bash
node --version
npm --version
```

你应该看到类似以下的输出：
```
v18.xx.x
9.xx.x
```

### 3. 获取项目代码

如果你已经下载了项目代码，跳过此步骤。否则：

```bash
# 如果使用 Git
git clone <repository-url>
cd sales-report-app

# 或者直接下载并解压项目文件
```

### 4. 安装项目依赖

在项目根目录下运行：

```bash
npm install
```

这将安装所有必要的依赖包。根据网络速度，这可能需要几分钟时间。

### 5. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

### 6. 构建生产版本（可选）

如果要部署生产版本：

```bash
npm run build
npm start
```

生产版本将在 http://localhost:3000 启动。

## 故障排除

### 常见问题及解决方案

#### 1. "command not found: node" 或 "command not found: npm"

- 确保 Node.js 已正确安装
- 重启终端或命令提示符
- 检查 PATH 环境变量是否包含 Node.js 安装路径

#### 2. 权限错误

在某些系统上，可能需要使用 `sudo`：

```bash
sudo npm install
```

或者配置 npm 以避免权限问题：

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### 3. 端口被占用

如果 3000 端口被占用，可以指定其他端口：

```bash
PORT=4000 npm run dev
```

#### 4. 依赖安装失败

尝试清理缓存：

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 5. 登录问题

如果遇到登录问题，请确保：

- 使用正确的用户名和密码组合
- 所有预设账户的密码都是 `password123`
- 用户名格式正确（如 `store1_staff`, `store2_manager`, `admin`）
- 确保浏览器启用了 JavaScript 和 localStorage
- 清除浏览器缓存和 cookies 后重试

#### 6. 服务端渲染错误

如果遇到 "localStorage is not defined" 等服务端渲染错误：

- 这通常是由于在服务端渲染期间访问了浏览器特定的 API
- 我们已经修复了大部分此类问题，确保在访问 localStorage 前检查 `typeof window !== 'undefined'`
- 如果仍有问题，请刷新页面重试

#### 7. 组件渲染错误

如果遇到 "Element type is invalid" 错误：

- 这通常是由于组件导入/导出问题或图标库使用不当
- 确保 antd-mobile 图标正确导入，如：
  ```javascript
  import { AppOutline } from 'antd-mobile';
  ```
- 确保所有组件都正确导出和导入
- 重新安装依赖：`npm install`

#### 8. 模块未找到错误

如果遇到 "Module not found" 错误：

- 确保所有依赖都已正确安装：`npm install`
- 检查导入路径是否正确
- 对于 antd-mobile，图标应从 'antd-mobile' 直接导入，而不是 'antd-mobile/icons'
- 例如：`import { Button, Input } from 'antd-mobile';`

#### 9. Next.js 版本过时警告

如果看到 "Next.js (14.0.0) is outdated" 警告：

- 这是一个警告，不影响应用运行
- 如果你想升级到最新版本，可以运行：
  ```bash
  npm install next@latest react@latest react-dom@latest
  ```
- 请注意，升级可能会引入不兼容的变更，建议在开发环境中先测试

## 预设账户信息

### 门店员工账户
- `store1_staff` / `password123`
- `store2_staff` / `password123`
- `store3_staff` / `password123`
- `store4_staff` / `password123`
- `store5_staff` / `password123`
- `store6_staff` / `password123`

### 门店经理账户
- `store1_manager` / `password123`
- `store2_manager` / `password123`
- `store3_manager` / `password123`
- `store4_manager` / `password123`
- `store5_manager` / `password123`
- `store6_manager` / `password123`

### 管理员账户
- `admin` / `password123`

## 配置说明

### 环境变量

项目支持以下环境变量：

- `PORT`: 指定应用运行端口（默认: 3000）
- `NODE_ENV`: 指定运行环境（development/production，默认: development）

创建 `.env.local` 文件来设置环境变量：

```bash
PORT=8080
NODE_ENV=production
```

## 使用说明

### 登录账户

使用以上预设账户登录：

- 门店员工账户：`store1_staff` / `password123`
- 门店经理账户：`store1_manager` / `password123`
- 管理员账户：`admin` / `password123`

### 功能说明

1. **销售报告填报**：在首页填写每日销售数据
2. **历史记录**：查看已提交的销售报告
3. **数据统计**：管理员可查看各门店统计信息

## 维护和更新

### 更新依赖

```bash
npm update
```

### 重新构建

```bash
npm run build
```

### 日志查看

应用运行时会在终端输出日志信息，注意查看是否有错误信息。

## 安全注意事项

1. 生产环境中请使用强密码
2. 定期更新依赖包
3. 不要在生产环境中使用开发模式
4. 考虑使用反向代理（如 Nginx）和 SSL 证书

## 卸载

如需卸载应用：

1. 删除项目文件夹
2. 如需卸载 Node.js，请使用系统卸载工具或包管理器

对于 Homebrew 安装的 Node.js：
```bash
brew uninstall node
```