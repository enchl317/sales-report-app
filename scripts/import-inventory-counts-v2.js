/**
 * 库存盘点数据导入脚本（按商品名称匹配）
 * 
 * 使用方法：
 * 1. 将此脚本上传到服务器
 * 2. 修改下方的数据库连接配置
 * 3. 执行: node import-inventory-counts-v2.js
 */

const mysql = require('mysql2/promise');

async function main() {
  // 请根据实际情况修改以下数据库配置
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'enchl',
    password: '12345678',
    database: 'sales_report_db',
    multipleStatements: true
  });

  console.log('开始导入库存盘点数据...\n');

  try {
    // 先获取所有商品信息，建立名称到ID的映射
    console.log('获取商品信息...');
    const [products] = await connection.query('SELECT id, name FROM products');
    const productNameToId = {};
    const productIdToName = {};
    products.forEach(p => {
      productNameToId[p.name] = p.id;
      productIdToName[p.id] = p.name;
    });
    console.log(`获取到 ${products.length} 个商品信息。\n`);

    // 定义要导入的盘点单数据（ID使用7-12）
    const inventoryCounts = [
      { id: 7, store_id: 1, document_id: 'KCPD0120260421', created_date: '2026-04-20', storeName: '南京东路第一食品' },
      { id: 8, store_id: 6, document_id: 'KCPD0620260421', created_date: '2026-04-19', storeName: '百联中环店' },
      { id: 9, store_id: 4, document_id: 'KCPD0420260421', created_date: '2026-04-19', storeName: '全国土特产店' },
      { id: 10, store_id: 2, document_id: 'KCPD0220260421', created_date: '2026-04-19', storeName: '三鑫世界商厦店' },
      { id: 11, store_id: 3, document_id: 'KCPD0320260421', created_date: '2026-04-20', storeName: '汇联商厦店' },
      { id: 12, store_id: 5, document_id: 'KCPD0520260421', created_date: '2026-04-20', storeName: '五角场店' }
    ];

    // 盘点明细数据（使用商品名称匹配）
    const inventoryDetails = {
      7: [ // KCPD0120260421 - 南京东路第一食品
        { productName: '儿童营养猪肉酥（半成品）-CS', quantity: 892.5000 },
        { productName: '海苔猪肉酥（半成品）-CS', quantity: 0.0000 },
        { productName: '金丝猪肉松（半成品）-CS', quantity: 215.0000 },
        { productName: '每日拌饭猪肉酥', quantity: 102.5770 },
        { productName: '儿童营养猪肉酥（现制现售）', quantity: 31.8970 },
        { productName: '海苔猪肉酥（现制现售）', quantity: 0.0000 },
        { productName: '金丝猪肉松（现制现售）', quantity: 22.1620 },
        { productName: '高汤猪肉松（裸装）', quantity: 30.0000 },
        { productName: '无糖猪肉酥-CS', quantity: 42.1570 },
        { productName: '225G无糖猪肉酥-CS', quantity: 188.0000 },
        { productName: '118g原味猪肉酥', quantity: 50.0000 },
        { productName: '280g高汤猪肉松', quantity: 88.0000 },
        { productName: '香酥猪肉酥', quantity: 0.0000 },
        { productName: '特制猪肉酥', quantity: 53.7710 },
        { productName: '原汁碎肉脯', quantity: 31.2500 },
        { productName: '猪脆脆（岩烧猪肉脯）', quantity: 7.2840 },
        { productName: '黑色原切猪肉脯', quantity: 9.2330 },
        { productName: '原切猪肉脯', quantity: 6.7870 },
        { productName: '古早猪肉脯', quantity: 13.1940 },
        { productName: '炭烧猪肉脯', quantity: 27.0000 },
        { productName: '港式猪肉脯', quantity: 227.3310 },
        { productName: '原切特级猪肉脯（原味）', quantity: 17.1840 },
        { productName: '原切特级猪肉脯（黑胡椒味）', quantity: 39.2040 },
        { productName: '鳕鱼圆片', quantity: 31.3220 },
        { productName: '鳕鱼鱼松', quantity: 0.0000 },
        { productName: '三文鱼鱼松', quantity: 9.3060 },
        { productName: '金枪鱼鱼松', quantity: 8.7470 },
        { productName: '五香牛肉干', quantity: 58.1410 },
        { productName: '油', quantity: 2.0000 },
        { productName: '厨师自封袋（小号）', quantity: 1750.0000 },
        { productName: '厨师上海地标自封袋（大号）', quantity: 3200.0000 },
        { productName: '厨师马夹袋（大号）', quantity: 60.0000 },
        { productName: '厨师礼盒', quantity: 13.0000 },
        { productName: '厨师上海地标牛皮纸礼袋', quantity: 2300.0000 },
        { productName: '厨师无纺布袋（大）', quantity: 100.0000 }
      ],
      8: [ // KCPD0620260421 - 百联中环店
        { productName: '儿童营养猪肉酥（半成品）-CS', quantity: 117.5000 },
        { productName: '海苔猪肉酥（半成品）-CS', quantity: 40.0000 },
        { productName: '金丝猪肉松（半成品）-CS', quantity: 12.5000 },
        { productName: '每日拌饭猪肉酥', quantity: 12.2000 },
        { productName: '儿童营养猪肉酥（现制现售）', quantity: 10.4600 },
        { productName: '海苔猪肉酥（现制现售）', quantity: 4.3440 },
        { productName: '金丝猪肉松（现制现售）', quantity: 3.7040 },
        { productName: '高汤猪肉松（裸装）', quantity: 0.0000 },
        { productName: '无糖猪肉酥-CS', quantity: 5.7120 },
        { productName: '225G无糖猪肉酥-CS', quantity: 44.0000 },
        { productName: '118g原味猪肉酥', quantity: 15.0000 },
        { productName: '280g高汤猪肉松', quantity: 47.0000 },
        { productName: '香酥猪肉酥', quantity: 9.5760 },
        { productName: '特制猪肉酥', quantity: 0.0000 },
        { productName: '原汁碎肉脯', quantity: 6.7500 },
        { productName: '猪脆脆（岩烧猪肉脯）', quantity: 9.9700 },
        { productName: '黑色原切猪肉脯', quantity: 0.0000 },
        { productName: '原切猪肉脯', quantity: 1.4600 },
        { productName: '古早猪肉脯', quantity: 0.0000 },
        { productName: '炭烧猪肉脯', quantity: 0.0000 },
        { productName: '港式猪肉脯', quantity: 4.4950 },
        { productName: '原切特级猪肉脯（原味）', quantity: 0.0000 },
        { productName: '原切特级猪肉脯（黑胡椒味）', quantity: 0.8700 },
        { productName: '鳕鱼圆片', quantity: 8.0260 },
        { productName: '鳕鱼鱼松', quantity: 2.1000 },
        { productName: '三文鱼鱼松', quantity: 1.8110 },
        { productName: '金枪鱼鱼松', quantity: 1.8350 },
        { productName: '五香牛肉干', quantity: 4.0320 },
        { productName: '油', quantity: 1.0000 },
        { productName: '厨师自封袋（小号）', quantity: 330.0000 },
        { productName: '厨师上海地标自封袋（大号）', quantity: 1280.0000 },
        { productName: '厨师马夹袋（大号）', quantity: 0.0000 },
        { productName: '厨师礼盒', quantity: 0.0000 },
        { productName: '厨师上海地标牛皮纸礼袋', quantity: 600.0000 },
        { productName: '厨师无纺布袋（大）', quantity: 80.0000 }
      ],
      9: [ // KCPD0420260421 - 全国土特产店
        { productName: '儿童营养猪肉酥（半成品）-CS', quantity: 55.0000 },
        { productName: '海苔猪肉酥（半成品）-CS', quantity: 80.0000 },
        { productName: '金丝猪肉松（半成品）-CS', quantity: 30.0000 },
        { productName: '每日拌饭猪肉酥', quantity: 1.5500 },
        { productName: '儿童营养猪肉酥（现制现售）', quantity: 7.1900 },
        { productName: '海苔猪肉酥（现制现售）', quantity: 3.1900 },
        { productName: '金丝猪肉松（现制现售）', quantity: 5.4900 },
        { productName: '高汤猪肉松（裸装）', quantity: 1.6400 },
        { productName: '无糖猪肉酥-CS', quantity: 0.1600 },
        { productName: '225G无糖猪肉酥-CS', quantity: 116.0000 },
        { productName: '118g原味猪肉酥', quantity: 0.0000 },
        { productName: '280g高汤猪肉松', quantity: 18.0000 },
        { productName: '香酥猪肉酥', quantity: 5.5600 },
        { productName: '特制猪肉酥', quantity: 3.6700 },
        { productName: '原汁碎肉脯', quantity: 18.0000 },
        { productName: '猪脆脆（岩烧猪肉脯）', quantity: 0.0000 },
        { productName: '黑色原切猪肉脯', quantity: 0.0000 },
        { productName: '原切猪肉脯', quantity: 0.0000 },
        { productName: '古早猪肉脯', quantity: 0.0000 },
        { productName: '炭烧猪肉脯', quantity: 0.0000 },
        { productName: '港式猪肉脯', quantity: 2.3000 },
        { productName: '原切特级猪肉脯（原味）', quantity: 0.0000 },
        { productName: '原切特级猪肉脯（黑胡椒味）', quantity: 0.0000 },
        { productName: '鳕鱼圆片', quantity: 5.5000 },
        { productName: '鳕鱼鱼松', quantity: 2.6700 },
        { productName: '三文鱼鱼松', quantity: 1.6700 },
        { productName: '金枪鱼鱼松', quantity: 3.4500 },
        { productName: '五香牛肉干', quantity: 6.1000 },
        { productName: '油', quantity: 3.3000 },
        { productName: '厨师自封袋（小号）', quantity: 560.0000 },
        { productName: '厨师上海地标自封袋（大号）', quantity: 810.0000 },
        { productName: '厨师马夹袋（大号）', quantity: 0.0000 },
        { productName: '厨师礼盒', quantity: 0.0000 },
        { productName: '厨师上海地标牛皮纸礼袋', quantity: 70.0000 },
        { productName: '厨师无纺布袋（大）', quantity: 30.0000 }
      ],
      10: [ // KCPD0220260421 - 三鑫世界商厦店
        { productName: '儿童营养猪肉酥（半成品）-CS', quantity: 190.0000 },
        { productName: '海苔猪肉酥（半成品）-CS', quantity: 52.5000 },
        { productName: '金丝猪肉松（半成品）-CS', quantity: 37.5000 },
        { productName: '每日拌饭猪肉酥', quantity: 0.0000 },
        { productName: '儿童营养猪肉酥（现制现售）', quantity: 0.1840 },
        { productName: '海苔猪肉酥（现制现售）', quantity: 4.0060 },
        { productName: '金丝猪肉松（现制现售）', quantity: 1.4330 },
        { productName: '高汤猪肉松（裸装）', quantity: 0.0000 },
        { productName: '无糖猪肉酥-CS', quantity: 6.6660 },
        { productName: '225G无糖猪肉酥-CS', quantity: 36.0000 },
        { productName: '118g原味猪肉酥', quantity: 3.0000 },
        { productName: '280g高汤猪肉松', quantity: 25.0000 },
        { productName: '香酥猪肉酥', quantity: 0.4540 },
        { productName: '特制猪肉酥', quantity: 1.0780 },
        { productName: '原汁碎肉脯', quantity: 14.2500 },
        { productName: '猪脆脆（岩烧猪肉脯）', quantity: 0.0000 },
        { productName: '黑色原切猪肉脯', quantity: 0.0000 },
        { productName: '原切猪肉脯', quantity: 0.3140 },
        { productName: '古早猪肉脯', quantity: 5.7960 },
        { productName: '炭烧猪肉脯', quantity: 0.0510 },
        { productName: '港式猪肉脯', quantity: 0.0000 },
        { productName: '原切特级猪肉脯（原味）', quantity: 8.7280 },
        { productName: '原切特级猪肉脯（黑胡椒味）', quantity: 0.0000 },
        { productName: '鳕鱼圆片', quantity: 4.5610 },
        { productName: '鳕鱼鱼松', quantity: 1.3690 },
        { productName: '三文鱼鱼松', quantity: 2.5190 },
        { productName: '金枪鱼鱼松', quantity: 3.2450 },
        { productName: '五香牛肉干', quantity: 18.3490 },
        { productName: '油', quantity: 2.0000 },
        { productName: '厨师自封袋（小号）', quantity: 170.0000 },
        { productName: '厨师上海地标自封袋（大号）', quantity: 970.0000 },
        { productName: '厨师马夹袋（大号）', quantity: 340.0000 },
        { productName: '厨师礼盒', quantity: 0.0000 },
        { productName: '厨师上海地标牛皮纸礼袋', quantity: 220.0000 },
        { productName: '厨师无纺布袋（大）', quantity: 80.0000 }
      ],
      11: [ // KCPD0320260421 - 汇联商厦店
        { productName: '儿童营养猪肉酥（半成品）-CS', quantity: 210.0000 },
        { productName: '海苔猪肉酥（半成品）-CS', quantity: 40.0000 },
        { productName: '金丝猪肉松（半成品）-CS', quantity: 25.0000 },
        { productName: '每日拌饭猪肉酥', quantity: 0.0000 },
        { productName: '儿童营养猪肉酥（现制现售）', quantity: 4.6480 },
        { productName: '海苔猪肉酥（现制现售）', quantity: 5.3100 },
        { productName: '金丝猪肉松（现制现售）', quantity: 6.3300 },
        { productName: '高汤猪肉松（裸装）', quantity: 0.0000 },
        { productName: '无糖猪肉酥-CS', quantity: 0.0000 },
        { productName: '225G无糖猪肉酥-CS', quantity: 73.0000 },
        { productName: '118g原味猪肉酥', quantity: 0.0000 },
        { productName: '280g高汤猪肉松', quantity: 48.0000 },
        { productName: '香酥猪肉酥', quantity: 43.5500 },
        { productName: '特制猪肉酥', quantity: 4.9190 },
        { productName: '原汁碎肉脯', quantity: 5.5000 },
        { productName: '猪脆脆（岩烧猪肉脯）', quantity: 0.0000 },
        { productName: '黑色原切猪肉脯', quantity: 0.0000 },
        { productName: '原切猪肉脯', quantity: 0.0000 },
        { productName: '古早猪肉脯', quantity: 0.0000 },
        { productName: '炭烧猪肉脯', quantity: 0.0000 },
        { productName: '港式猪肉脯', quantity: 33.1500 },
        { productName: '原切特级猪肉脯（原味）', quantity: 0.0000 },
        { productName: '原切特级猪肉脯（黑胡椒味）', quantity: 0.0000 },
        { productName: '鳕鱼圆片', quantity: 5.0610 },
        { productName: '鳕鱼鱼松', quantity: 0.8500 },
        { productName: '三文鱼鱼松', quantity: 0.0000 },
        { productName: '金枪鱼鱼松', quantity: 0.0850 },
        { productName: '五香牛肉干', quantity: 3.8820 },
        { productName: '油', quantity: 6.0000 },
        { productName: '厨师自封袋（小号）', quantity: 1100.0000 },
        { productName: '厨师上海地标自封袋（大号）', quantity: 1050.0000 },
        { productName: '厨师马夹袋（大号）', quantity: 0.0000 },
        { productName: '厨师礼盒', quantity: 0.0000 },
        { productName: '厨师上海地标牛皮纸礼袋', quantity: 0.0000 },
        { productName: '厨师无纺布袋（大）', quantity: 0.0000 }
      ],
      12: [ // KCPD0520260421 - 五角场店
        { productName: '儿童营养猪肉酥（半成品）-CS', quantity: 80.0000 },
        { productName: '海苔猪肉酥（半成品）-CS', quantity: 57.5000 },
        { productName: '金丝猪肉松（半成品）-CS', quantity: 32.5000 },
        { productName: '每日拌饭猪肉酥', quantity: 7.5820 },
        { productName: '儿童营养猪肉酥（现制现售）', quantity: 9.0440 },
        { productName: '海苔猪肉酥（现制现售）', quantity: 1.2930 },
        { productName: '金丝猪肉松（现制现售）', quantity: 2.6970 },
        { productName: '高汤猪肉松（裸装）', quantity: 0.0000 },
        { productName: '无糖猪肉酥-CS', quantity: 14.2610 },
        { productName: '225G无糖猪肉酥-CS', quantity: 24.0000 },
        { productName: '118g原味猪肉酥', quantity: 4.0000 },
        { productName: '280g高汤猪肉松', quantity: 5.0000 },
        { productName: '香酥猪肉酥', quantity: 0.0000 },
        { productName: '特制猪肉酥', quantity: 4.9750 },
        { productName: '原汁碎肉脯', quantity: 2.0000 },
        { productName: '猪脆脆（岩烧猪肉脯）', quantity: 0.0000 },
        { productName: '黑色原切猪肉脯', quantity: 1.4860 },
        { productName: '原切猪肉脯', quantity: 0.0000 },
        { productName: '古早猪肉脯', quantity: 0.0000 },
        { productName: '炭烧猪肉脯', quantity: 2.5650 },
        { productName: '港式猪肉脯', quantity: 0.2660 },
        { productName: '原切特级猪肉脯（原味）', quantity: 0.9160 },
        { productName: '原切特级猪肉脯（黑胡椒味）', quantity: 3.5650 },
        { productName: '鳕鱼圆片', quantity: 5.4900 },
        { productName: '鳕鱼鱼松', quantity: 0.3370 },
        { productName: '三文鱼鱼松', quantity: 0.2490 },
        { productName: '金枪鱼鱼松', quantity: 1.9220 },
        { productName: '五香牛肉干', quantity: 11.4210 },
        { productName: '油', quantity: 2.0000 },
        { productName: '厨师自封袋（小号）', quantity: 620.0000 },
        { productName: '厨师上海地标自封袋（大号）', quantity: 150.0000 },
        { productName: '厨师马夹袋（大号）', quantity: 0.0000 },
        { productName: '厨师礼盒', quantity: 10.0000 },
        { productName: '厨师上海地标牛皮纸礼袋', quantity: 550.0000 },
        { productName: '厨师无纺布袋（大）', quantity: 0.0000 }
      ]
    };

    // 检查并删除已存在的记录
    console.log('检查并删除已存在的记录...');
    for (const ic of inventoryCounts) {
      // 检查是否存在
      const [existing] = await connection.query(
        'SELECT id FROM inventory_counts WHERE document_id = ?',
        [ic.document_id]
      );
      
      if (existing.length > 0) {
        const existingId = existing[0].id;
        console.log(`  发现已存在的盘点单 ${ic.document_id} (ID: ${existingId})，正在删除...`);
        // 先删除明细
        await connection.query('DELETE FROM inventory_count_details WHERE inventory_count_id = ?', [existingId]);
        // 再删除主表记录
        await connection.query('DELETE FROM inventory_counts WHERE id = ?', [existingId]);
        console.log(`  已删除盘点单 ${ic.document_id}`);
      }
    }
    console.log('清理完成。\n');

    // 插入库存盘点主表数据
    console.log('插入库存盘点主表数据...');
    for (const ic of inventoryCounts) {
      await connection.query(
        'INSERT INTO inventory_counts (id, store_id, document_id, created_date) VALUES (?, ?, ?, ?)',
        [ic.id, ic.store_id, ic.document_id, ic.created_date]
      );
      console.log(`  已插入: ${ic.document_id} - ${ic.storeName}`);
    }
    console.log('主表数据插入完成。\n');

    // 插入库存盘点明细表数据（按商品名称匹配）
    console.log('插入库存盘点明细表数据...');
    for (const ic of inventoryCounts) {
      const details = inventoryDetails[ic.id];
      let insertedCount = 0;
      let skippedCount = 0;
      for (const detail of details) {
        // 根据商品名称查找商品ID
        const productId = productNameToId[detail.productName];
        if (!productId) {
          console.log(`  警告: 商品 "${detail.productName}" 不存在，跳过`);
          skippedCount++;
          continue; // 跳过不存在的商品
        }
        await connection.query(
          'INSERT INTO inventory_count_details (inventory_count_id, product_id, product_name, counted_quantity) VALUES (?, ?, ?, ?)',
          [ic.id, productId, detail.productName, detail.quantity]
        );
        insertedCount++;
      }
      console.log(`  已插入 ${insertedCount} 条明细: ${ic.document_id} - ${ic.storeName} (跳过 ${skippedCount} 个不存在商品)`);
    }
    console.log('明细表数据插入完成。\n');

    console.log('===========================================');
    console.log('库存盘点数据导入成功！');
    console.log('===========================================');
    console.log('导入的盘点单：');
    for (const ic of inventoryCounts) {
      console.log(`  - ${ic.document_id}: ${ic.storeName} (${ic.created_date})`);
    }

  } catch (error) {
    console.error('导入失败:', error);
  } finally {
    await connection.end();
  }
}

main();