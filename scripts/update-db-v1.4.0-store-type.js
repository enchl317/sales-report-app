// scripts/update-db-v1.4.0-store-type.js
// 数据库更新脚本 v1.4.0 - 新增门店类型和商品线下售卖属性

const mysql = require('mysql2/promise');

async function updateDatabase() {
  let connection;
  
  try {
    console.log('正在连接到 MySQL 服务器...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'enchl',
      password: '12345678',
      port: 3306,
      database: 'sales_report_db'
    });
    
    console.log('连接成功，开始更新数据库...');
    
    // 1. 在门店表中新增"门店类型"字段（0=线下门店，1=电商门店）
    console.log('1. 正在检查并添加门店类型字段...');
    const [storeColumns] = await connection.query('SHOW COLUMNS FROM stores LIKE "store_type";');
    if (storeColumns.length === 0) {
      await connection.query('ALTER TABLE stores ADD COLUMN store_type TINYINT DEFAULT 0 COMMENT "门店类型：0=线下门店，1=电商门店";');
      console.log('   - 门店类型字段添加成功');
    } else {
      console.log('   - 门店类型字段已存在');
    }
    
    // 更新现有6个门店为线下门店
    console.log('   - 更新现有门店为线下门店...');
    await connection.query('UPDATE stores SET store_type = 0 WHERE id IN (1,2,3,4,5,6);');
    console.log('   - 现有门店更新完成');
    
    // 2. 新增电商仓库门店
    console.log('2. 正在新增电商仓库门店...');
    
    // 检查是否已存在电商奉贤仓库
    const [existingStore1] = await connection.query("SELECT id FROM stores WHERE name = '电商奉贤仓库';");
    if (existingStore1.length === 0) {
      await connection.query(
        "INSERT INTO stores (name, short_name, address, store_type) VALUES ('电商奉贤仓库', '电商奉贤仓库', '上海市上海市奉贤区洪庙镇洪朱公路11号洪宝路57号(到底最后一家)', 1);"
      );
      console.log('   - 电商奉贤仓库添加成功');
    } else {
      console.log('   - 电商奉贤仓库已存在');
    }
    
    // 检查是否已存在电商沪太路仓库
    const [existingStore2] = await connection.query("SELECT id FROM stores WHERE name = '电商沪太路仓库';");
    if (existingStore2.length === 0) {
      await connection.query(
        "INSERT INTO stores (name, short_name, address, store_type) VALUES ('电商沪太路仓库', '电商沪太路仓库', '上海市静安区沪太路129号3楼', 1);"
      );
      console.log('   - 电商沪太路仓库添加成功');
    } else {
      console.log('   - 电商沪太路仓库已存在');
    }
    
    // 3. 在商品表中新增"是否线下售卖"字段
    console.log('3. 正在检查并添加商品线下售卖字段...');
    const [productColumns] = await connection.query('SHOW COLUMNS FROM products LIKE "offline_sale";');
    if (productColumns.length === 0) {
      await connection.query('ALTER TABLE products ADD COLUMN offline_sale TINYINT DEFAULT 1 COMMENT "是否线下售卖：0=不售卖，1=售卖";');
      console.log('   - 商品线下售卖字段添加成功');
    } else {
      console.log('   - 商品线下售卖字段已存在');
    }
    
    // 更新所有商品为可线下售卖
    console.log('   - 更新所有商品为可线下售卖...');
    await connection.query('UPDATE products SET offline_sale = 1;');
    console.log('   - 商品更新完成');
    
    console.log('');
    console.log('========================================');
    console.log('数据库更新完成！');
    console.log('========================================');
    
    // 显示更新后的门店列表
    console.log('');
    console.log('更新后的门店列表：');
    const [stores] = await connection.query('SELECT id, name, short_name, store_type FROM stores ORDER BY id;');
    stores.forEach(store => {
      const typeText = store.store_type === 0 ? '线下门店' : '电商门店';
      console.log(`  ${store.id}. ${store.name} (${store.short_name}) - ${typeText}`);
    });
    
    // 显示更新后的商品数量
    console.log('');
    console.log('商品表更新统计：');
    const [products] = await connection.query('SELECT COUNT(*) as total, SUM(offline_sale) as offlineCount FROM products;');
    console.log(`  总商品数: ${products[0].total}`);
    console.log(`  可线下售卖: ${products[0].offlineCount}`);
    
  } catch (error) {
    console.error('数据库更新失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行更新
updateDatabase()
  .then(() => {
    console.log('');
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });