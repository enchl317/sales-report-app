/**
 * 库存盘点数据导入脚本
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
    user: 'root',
    password: '12345678',
    database: 'sales_report_db',
    multipleStatements: true
  });

  console.log('开始导入库存盘点数据...\n');

  try {
    // 先获取所有商品信息
    console.log('获取商品信息...');
    const [products] = await connection.query('SELECT id, name FROM products WHERE id >= 8 AND id <= 42');
    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = p.name;
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

    // 盘点明细数据（inventory_count_id对应上面的id）
    const inventoryDetails = {
      7: [ // KCPD0120260421 - 南京东路第一食品
        { product_id: 8, quantity: 892.5000 },
        { product_id: 9, quantity: 0.0000 },
        { product_id: 10, quantity: 215.0000 },
        { product_id: 11, quantity: 102.5770 },
        { product_id: 12, quantity: 31.8970 },
        { product_id: 13, quantity: 0.0000 },
        { product_id: 14, quantity: 22.1620 },
        { product_id: 15, quantity: 30.0000 },
        { product_id: 16, quantity: 42.1570 },
        { product_id: 17, quantity: 188.0000 },
        { product_id: 18, quantity: 50.0000 },
        { product_id: 19, quantity: 88.0000 },
        { product_id: 20, quantity: 0.0000 },
        { product_id: 21, quantity: 53.7710 },
        { product_id: 22, quantity: 31.2500 },
        { product_id: 23, quantity: 7.2840 },
        { product_id: 24, quantity: 9.2330 },
        { product_id: 25, quantity: 6.7870 },
        { product_id: 26, quantity: 13.1940 },
        { product_id: 27, quantity: 27.0000 },
        { product_id: 28, quantity: 227.3310 },
        { product_id: 29, quantity: 17.1840 },
        { product_id: 30, quantity: 39.2040 },
        { product_id: 31, quantity: 31.3220 },
        { product_id: 32, quantity: 0.0000 },
        { product_id: 33, quantity: 9.3060 },
        { product_id: 34, quantity: 8.7470 },
        { product_id: 35, quantity: 58.1410 },
        { product_id: 36, quantity: 2.0000 },
        { product_id: 37, quantity: 1750.0000 },
        { product_id: 38, quantity: 3200.0000 },
        { product_id: 39, quantity: 60.0000 },
        { product_id: 40, quantity: 13.0000 },
        { product_id: 41, quantity: 2300.0000 },
        { product_id: 42, quantity: 100.0000 }
      ],
      8: [ // KCPD0620260421 - 百联中环店
        { product_id: 8, quantity: 117.5000 },
        { product_id: 9, quantity: 40.0000 },
        { product_id: 10, quantity: 12.5000 },
        { product_id: 11, quantity: 12.2000 },
        { product_id: 12, quantity: 10.4600 },
        { product_id: 13, quantity: 4.3440 },
        { product_id: 14, quantity: 3.7040 },
        { product_id: 15, quantity: 0.0000 },
        { product_id: 16, quantity: 5.7120 },
        { product_id: 17, quantity: 44.0000 },
        { product_id: 18, quantity: 15.0000 },
        { product_id: 19, quantity: 47.0000 },
        { product_id: 20, quantity: 9.5760 },
        { product_id: 21, quantity: 0.0000 },
        { product_id: 22, quantity: 6.7500 },
        { product_id: 23, quantity: 9.9700 },
        { product_id: 24, quantity: 0.0000 },
        { product_id: 25, quantity: 1.4600 },
        { product_id: 26, quantity: 0.0000 },
        { product_id: 27, quantity: 0.0000 },
        { product_id: 28, quantity: 4.4950 },
        { product_id: 29, quantity: 0.0000 },
        { product_id: 30, quantity: 0.8700 },
        { product_id: 31, quantity: 8.0260 },
        { product_id: 32, quantity: 2.1000 },
        { product_id: 33, quantity: 1.8110 },
        { product_id: 34, quantity: 1.8350 },
        { product_id: 35, quantity: 4.0320 },
        { product_id: 36, quantity: 1.0000 },
        { product_id: 37, quantity: 330.0000 },
        { product_id: 38, quantity: 1280.0000 },
        { product_id: 39, quantity: 0.0000 },
        { product_id: 40, quantity: 0.0000 },
        { product_id: 41, quantity: 600.0000 },
        { product_id: 42, quantity: 80.0000 }
      ],
      9: [ // KCPD0420260421 - 全国土特产店
        { product_id: 8, quantity: 55.0000 },
        { product_id: 9, quantity: 80.0000 },
        { product_id: 10, quantity: 30.0000 },
        { product_id: 11, quantity: 1.5500 },
        { product_id: 12, quantity: 7.1900 },
        { product_id: 13, quantity: 3.1900 },
        { product_id: 14, quantity: 5.4900 },
        { product_id: 15, quantity: 1.6400 },
        { product_id: 16, quantity: 0.1600 },
        { product_id: 17, quantity: 116.0000 },
        { product_id: 18, quantity: 0.0000 },
        { product_id: 19, quantity: 18.0000 },
        { product_id: 20, quantity: 5.5600 },
        { product_id: 21, quantity: 3.6700 },
        { product_id: 22, quantity: 18.0000 },
        { product_id: 23, quantity: 0.0000 },
        { product_id: 24, quantity: 0.0000 },
        { product_id: 25, quantity: 0.0000 },
        { product_id: 26, quantity: 0.0000 },
        { product_id: 27, quantity: 0.0000 },
        { product_id: 28, quantity: 2.3000 },
        { product_id: 29, quantity: 0.0000 },
        { product_id: 30, quantity: 0.0000 },
        { product_id: 31, quantity: 5.5000 },
        { product_id: 32, quantity: 2.6700 },
        { product_id: 33, quantity: 1.6700 },
        { product_id: 34, quantity: 3.4500 },
        { product_id: 35, quantity: 6.1000 },
        { product_id: 36, quantity: 3.3000 },
        { product_id: 37, quantity: 560.0000 },
        { product_id: 38, quantity: 810.0000 },
        { product_id: 39, quantity: 0.0000 },
        { product_id: 40, quantity: 0.0000 },
        { product_id: 41, quantity: 70.0000 },
        { product_id: 42, quantity: 30.0000 }
      ],
      10: [ // KCPD0220260421 - 三鑫世界商厦店
        { product_id: 8, quantity: 190.0000 },
        { product_id: 9, quantity: 52.5000 },
        { product_id: 10, quantity: 37.5000 },
        { product_id: 11, quantity: 0.0000 },
        { product_id: 12, quantity: 0.1840 },
        { product_id: 13, quantity: 4.0060 },
        { product_id: 14, quantity: 1.4330 },
        { product_id: 15, quantity: 0.0000 },
        { product_id: 16, quantity: 6.6660 },
        { product_id: 17, quantity: 36.0000 },
        { product_id: 18, quantity: 3.0000 },
        { product_id: 19, quantity: 25.0000 },
        { product_id: 20, quantity: 0.4540 },
        { product_id: 21, quantity: 1.0780 },
        { product_id: 22, quantity: 14.2500 },
        { product_id: 23, quantity: 0.0000 },
        { product_id: 24, quantity: 0.0000 },
        { product_id: 25, quantity: 0.3140 },
        { product_id: 26, quantity: 5.7960 },
        { product_id: 27, quantity: 0.0510 },
        { product_id: 28, quantity: 0.0000 },
        { product_id: 29, quantity: 8.7280 },
        { product_id: 30, quantity: 0.0000 },
        { product_id: 31, quantity: 4.5610 },
        { product_id: 32, quantity: 1.3690 },
        { product_id: 33, quantity: 2.5190 },
        { product_id: 34, quantity: 3.2450 },
        { product_id: 35, quantity: 18.3490 },
        { product_id: 36, quantity: 2.0000 },
        { product_id: 37, quantity: 170.0000 },
        { product_id: 38, quantity: 970.0000 },
        { product_id: 39, quantity: 340.0000 },
        { product_id: 40, quantity: 0.0000 },
        { product_id: 41, quantity: 220.0000 },
        { product_id: 42, quantity: 80.0000 }
      ],
      11: [ // KCPD0320260421 - 汇联商厦店
        { product_id: 8, quantity: 210.0000 },
        { product_id: 9, quantity: 40.0000 },
        { product_id: 10, quantity: 25.0000 },
        { product_id: 11, quantity: 0.0000 },
        { product_id: 12, quantity: 4.6480 },
        { product_id: 13, quantity: 5.3100 },
        { product_id: 14, quantity: 6.3300 },
        { product_id: 15, quantity: 0.0000 },
        { product_id: 16, quantity: 0.0000 },
        { product_id: 17, quantity: 73.0000 },
        { product_id: 18, quantity: 0.0000 },
        { product_id: 19, quantity: 48.0000 },
        { product_id: 20, quantity: 43.5500 },
        { product_id: 21, quantity: 4.9190 },
        { product_id: 22, quantity: 5.5000 },
        { product_id: 23, quantity: 0.0000 },
        { product_id: 24, quantity: 0.0000 },
        { product_id: 25, quantity: 0.0000 },
        { product_id: 26, quantity: 0.0000 },
        { product_id: 27, quantity: 0.0000 },
        { product_id: 28, quantity: 33.1500 },
        { product_id: 29, quantity: 0.0000 },
        { product_id: 30, quantity: 0.0000 },
        { product_id: 31, quantity: 5.0610 },
        { product_id: 32, quantity: 0.8500 },
        { product_id: 33, quantity: 0.0000 },
        { product_id: 34, quantity: 0.0850 },
        { product_id: 35, quantity: 3.8820 },
        { product_id: 36, quantity: 6.0000 },
        { product_id: 37, quantity: 1100.0000 },
        { product_id: 38, quantity: 1050.0000 },
        { product_id: 39, quantity: 0.0000 },
        { product_id: 40, quantity: 0.0000 },
        { product_id: 41, quantity: 0.0000 },
        { product_id: 42, quantity: 0.0000 }
      ],
      12: [ // KCPD0520260421 - 五角场店
        { product_id: 8, quantity: 80.0000 },
        { product_id: 9, quantity: 57.5000 },
        { product_id: 10, quantity: 32.5000 },
        { product_id: 11, quantity: 7.5820 },
        { product_id: 12, quantity: 9.0440 },
        { product_id: 13, quantity: 1.2930 },
        { product_id: 14, quantity: 2.6970 },
        { product_id: 15, quantity: 0.0000 },
        { product_id: 16, quantity: 14.2610 },
        { product_id: 17, quantity: 24.0000 },
        { product_id: 18, quantity: 4.0000 },
        { product_id: 19, quantity: 5.0000 },
        { product_id: 20, quantity: 0.0000 },
        { product_id: 21, quantity: 4.9750 },
        { product_id: 22, quantity: 2.0000 },
        { product_id: 23, quantity: 0.0000 },
        { product_id: 24, quantity: 1.4860 },
        { product_id: 25, quantity: 0.0000 },
        { product_id: 26, quantity: 0.0000 },
        { product_id: 27, quantity: 2.5650 },
        { product_id: 28, quantity: 0.2660 },
        { product_id: 29, quantity: 0.9160 },
        { product_id: 30, quantity: 3.5650 },
        { product_id: 31, quantity: 5.4900 },
        { product_id: 32, quantity: 0.3370 },
        { product_id: 33, quantity: 0.2490 },
        { product_id: 34, quantity: 1.9220 },
        { product_id: 35, quantity: 11.4210 },
        { product_id: 36, quantity: 2.0000 },
        { product_id: 37, quantity: 620.0000 },
        { product_id: 38, quantity: 150.0000 },
        { product_id: 39, quantity: 0.0000 },
        { product_id: 40, quantity: 10.0000 },
        { product_id: 41, quantity: 550.0000 },
        { product_id: 42, quantity: 0.0000 }
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

    // 插入库存盘点明细表数据
    console.log('插入库存盘点明细表数据...');
    for (const ic of inventoryCounts) {
      const details = inventoryDetails[ic.id];
      for (const detail of details) {
        const productName = productMap[detail.product_id] || `商品${detail.product_id}`;
        await connection.query(
          'INSERT INTO inventory_count_details (inventory_count_id, product_id, product_name, counted_quantity) VALUES (?, ?, ?, ?)',
          [ic.id, detail.product_id, productName, detail.quantity]
        );
      }
      console.log(`  已插入 ${details.length} 条明细: ${ic.document_id} - ${ic.storeName}`);
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