# 数据库更新指南

## 概述
本指南描述了如何为销售报告应用进行数据库更新，同时保持 `init-db.js` 初始化脚本不变。

## 更新原则
1. **不得修改** `scripts/init-db.js` 初始化脚本
2. **必须使用** 独立的更新脚本
3. **遵循命名规范**: `update-db-vX.Y.Z.js`
4. **向后兼容**: 确保更新不影响现有数据

## 创建更新脚本

### 步骤 1: 创建新脚本
```bash
cp scripts/update-db-v1.0.1.js scripts/update-db-vX.Y.Z.js
```

### 步骤 2: 编写更新逻辑
```javascript
// scripts/update-db-vX.Y.Z.js
const mysql = require('mysql2/promise');

async function updateDatabase() {
  try {
    console.log('正在连接到 MySQL 服务器...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345678',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'sales_report_db'
    });
    
    console.log('连接成功，开始执行数据库更新...');
    
    // 添加你的更新逻辑
    // 示例：
    // await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);`);
    
    console.log('数据库更新完成！');
    
    await connection.end();
    
  } catch (error) {
    console.error('数据库更新失败:', error);
  }
}

updateDatabase();
```

### 步骤 3: 测试更新脚本
```bash
node scripts/update-db-vX.Y.Z.js
```

## 常见更新类型

### 添加新字段
```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name datatype;
```

### 修改字段
```sql
ALTER TABLE table_name MODIFY COLUMN column_name new_datatype;
```

### 添加新表
```sql
CREATE TABLE IF NOT EXISTS new_table_name (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ...
);
```

### 添加索引
```sql
CREATE INDEX IF NOT EXISTS index_name ON table_name (column_name);
```

## 版本控制

### Git 标签
每次发布新版本时创建标签：
```bash
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin vX.Y.Z
```

### 更新日志
在 `CHANGELOG.md` 中记录每次更新：
```markdown
## [X.Y.Z] - YYYY-MM-DD
### Added
- 新功能描述

### Changed
- 变更功能描述

### Fixed
- 修复问题描述
```

## 回滚策略

### 数据库备份
在执行任何更新前，先备份数据库：
```bash
mysqldump -u username -p database_name > backup_file.sql
```

### 更新回滚
如果更新出现问题，可以从备份恢复：
```bash
mysql -u username -p database_name < backup_file.sql
```

## 最佳实践

1. **测试环境先行**: 在生产环境执行更新前，先在测试环境验证
2. **备份数据**: 每次更新前备份数据库
3. **分步执行**: 复杂更新分解为多个简单步骤
4. **验证结果**: 更新后验证数据完整性
5. **文档记录**: 记录每次更新的内容和影响