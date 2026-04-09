// scripts/update-db-v1.5.0-add-plum-products.js
// 更新数据库结构，添加话梅品类和新商品

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

async function updateDatabase() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sales_report'
    });

    console.log('正在连接数据库...');

    // 检查 offline_sale 字段是否已存在，如不存在则添加
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'offline_sale'
    `, [process.env.DB_NAME || 'sales_report']);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN offline_sale TINYINT(1) DEFAULT 1 COMMENT '是否线下售卖：1-是，0-否'
      `);
      console.log('✅ offline_sale 字段已成功添加到 products 表');
    } else {
      console.log('ℹ️ offline_sale 字段已存在，无需添加');
    }

    // 新增商品列表
    const newProducts = [
      {
        name: '50g梅片',
        code: '',
        category: '话梅',
        specification: '50',
        unit: '克',
        sortOrder: 41,
        offlineSale: 0  // 否
      },
      {
        name: '400g话梅',
        code: '',
        category: '话梅',
        specification: '400',
        unit: '克',
        sortOrder: 42,
        offlineSale: 0  // 否
      },
      {
        name: '200g梅条',
        code: '',
        category: '话梅',
        specification: '200',
        unit: '克',
        sortOrder: 43,
        offlineSale: 0  // 否
      },
      {
        name: '80g肉脯',
        code: '',
        category: '肉干与其它',
        specification: '80',
        unit: '克',
        sortOrder: 29,
        offlineSale: 0  // 否
      }
    ];

    // 检查商品是否已存在（根据名称和规格判断）
    let addedCount = 0;
    let skippedCount = 0;

    for (const product of newProducts) {
      const [existing] = await connection.query(`
        SELECT id FROM products 
        WHERE name = ? AND (specification = ? OR (specification IS NULL AND ? IS NULL))
      `, [product.name, product.specification, product.specification]);

      if (existing.length > 0) {
        console.log(`⏭️ 跳过已存在的商品: ${product.name} (${product.specification}${product.unit})`);
        skippedCount++;
      } else {
        await connection.query(`
          INSERT INTO products (name, code, category, specification, unit, sort_order, offline_sale) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          product.name,
          product.code || null,
          product.category,
          product.specification,
          product.unit,
          product.sortOrder,
          product.offlineSale
        ]);
        console.log(`✅ 新增商品: ${product.name} (${product.specification}${product.unit}) - ${product.category}`);
        addedCount++;
      }
    }

    console.log(`\n📊 新增 ${addedCount} 个商品，跳过 ${skippedCount} 个已存在的商品`);
    console.log('\n✅ 数据库更新完成！');
    
  } catch (error) {
    console.error('❌ 数据库更新失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行更新
updateDatabase();