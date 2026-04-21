/**
 * 库存盘点数据导入脚本
 * 
 * 使用方法：
 * 1. 将此脚本上传到服务器
 * 2. 修改下方的数据库连接配置
 * 3. 执行: node import-inventory-counts-v2.js
 * 
 * 或直接在MySQL客户端执行SQL部分
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
    // 插入库存盘点主表数据
    console.log('插入库存盘点主表数据...');
    await connection.query(`
      INSERT INTO inventory_counts (id, store_id, document_id, created_date) VALUES (4, 1, 'KCPD0120260421', '2026-04-20');
      INSERT INTO inventory_counts (id, store_id, document_id, created_date) VALUES (5, 6, 'KCPD0620260421', '2026-04-19');
      INSERT INTO inventory_counts (id, store_id, document_id, created_date) VALUES (6, 4, 'KCPD0420260421', '2026-04-19');
      INSERT INTO inventory_counts (id, store_id, document_id, created_date) VALUES (7, 2, 'KCPD0220260421', '2026-04-19');
      INSERT INTO inventory_counts (id, store_id, document_id, created_date) VALUES (8, 3, 'KCPD0320260421', '2026-04-20');
      INSERT INTO inventory_counts (id, store_id, document_id, created_date) VALUES (9, 5, 'KCPD0520260421', '2026-04-20');
    `);
    console.log('主表数据插入完成。\n');

    // 插入库存盘点明细表数据
    console.log('插入库存盘点明细表数据...');
    
    // 盘点单 4 - 南京东路第一食品 (2026-04-20)
    await connection.query(`
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 8, 892.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 9, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 10, 215.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 11, 102.5770);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 12, 31.8970);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 13, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 14, 22.1620);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 15, 30.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 16, 42.1570);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 17, 188.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 18, 50.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 19, 88.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 20, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 21, 53.7710);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 22, 31.2500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 23, 7.2840);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 24, 9.2330);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 25, 6.7870);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 26, 13.1940);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 27, 27.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 28, 227.3310);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 29, 17.1840);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 30, 39.2040);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 31, 31.3220);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 32, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 33, 9.3060);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 34, 8.7470);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 35, 58.1410);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 36, 2.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 37, 1750.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 38, 3200.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 39, 60.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 40, 13.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 41, 2300.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (4, 42, 100.0000);
    `);

    // 盘点单 5 - 百联中环店 (2026-04-19)
    await connection.query(`
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 8, 117.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 9, 40.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 10, 12.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 11, 12.2000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 12, 10.4600);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 13, 4.3440);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 14, 3.7040);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 15, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 16, 5.7120);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 17, 44.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 18, 15.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 19, 47.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 20, 9.5760);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 21, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 22, 6.7500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 23, 9.9700);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 24, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 25, 1.4600);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 26, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 27, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 28, 4.4950);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 29, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 30, 0.8700);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 31, 8.0260);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 32, 2.1000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 33, 1.8110);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 34, 1.8350);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 35, 4.0320);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 36, 1.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 37, 330.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 38, 1280.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 39, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 40, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 41, 600.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (5, 42, 80.0000);
    `);

    // 盘点单 6 - 全国土特产店 (2026-04-19)
    await connection.query(`
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 8, 55.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 9, 80.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 10, 30.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 11, 1.5500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 12, 7.1900);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 13, 3.1900);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 14, 5.4900);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 15, 1.6400);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 16, 0.1600);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 17, 116.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 18, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 19, 18.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 20, 5.5600);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 21, 3.6700);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 22, 18.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 23, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 24, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 25, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 26, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 27, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 28, 2.3000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 29, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 30, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 31, 5.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 32, 2.6700);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 33, 1.6700);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 34, 3.4500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 35, 6.1000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 36, 3.3000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 37, 560.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 38, 810.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 39, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 40, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 41, 70.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (6, 42, 30.0000);
    `);

    // 盘点单 7 - 三鑫世界商厦店 (2026-04-19)
    await connection.query(`
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 8, 190.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 9, 52.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 10, 37.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 11, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 12, 0.1840);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 13, 4.0060);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 14, 1.4330);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 15, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 16, 6.6660);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 17, 36.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 18, 3.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 19, 25.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 20, 0.4540);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 21, 1.0780);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 22, 14.2500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 23, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 24, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 25, 0.3140);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 26, 5.7960);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 27, 0.0510);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 28, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 29, 8.7280);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 30, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 31, 4.5610);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 32, 1.3690);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 33, 2.5190);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 34, 3.2450);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 35, 18.3490);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 36, 2.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 37, 170.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 38, 970.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 39, 340.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 40, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 41, 220.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (7, 42, 80.0000);
    `);

    // 盘点单 8 - 汇联商厦店 (2026-04-20)
    await connection.query(`
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 8, 210.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 9, 40.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 10, 25.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 11, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 12, 4.6480);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 13, 5.3100);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 14, 6.3300);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 15, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 16, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 17, 73.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 18, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 19, 48.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 20, 43.5500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 21, 4.9190);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 22, 5.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 23, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 24, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 25, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 26, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 27, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 28, 33.1500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 29, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 30, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 31, 5.0610);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 32, 0.8500);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 33, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 34, 0.0850);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 35, 3.8820);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 36, 6.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 37, 1100.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 38, 1050.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 39, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 40, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 41, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (8, 42, 0.0000);
    `);

    // 盘点单 9 - 五角场店 (2026-04-20)
    await connection.query(`
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 8, 80.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 9, 57.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 10, 32.5000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 11, 7.5820);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 12, 9.0440);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 13, 1.2930);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 14, 2.6970);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 15, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 16, 14.2610);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 17, 24.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 18, 4.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 19, 5.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 20, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 21, 4.9750);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 22, 2.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 23, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 24, 1.4860);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 25, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 26, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 27, 2.5650);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 28, 0.2660);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 29, 0.9160);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 30, 3.5650);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 31, 5.4900);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 32, 0.3370);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 33, 0.2490);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 34, 1.9220);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 35, 11.4210);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 36, 2.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 37, 620.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 38, 150.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 39, 0.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 40, 10.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 41, 550.0000);
      INSERT INTO inventory_count_details (inventory_count_id, product_id, counted_quantity) VALUES (9, 42, 0.0000);
    `);

    console.log('明细表数据插入完成。\n');
    console.log('===========================================');
    console.log('库存盘点数据导入成功！');
    console.log('===========================================');
    console.log('导入的盘点单：');
    console.log('  - KCPD0120260421: 南京东路第一食品 (2026-04-20)');
    console.log('  - KCPD0220260421: 三鑫世界商厦店 (2026-04-19)');
    console.log('  - KCPD0320260421: 汇联商厦店 (2026-04-20)');
    console.log('  - KCPD0420260421: 全国土特产店 (2026-04-19)');
    console.log('  - KCPD0520260421: 五角场店 (2026-04-20)');
    console.log('  - KCPD0620260421: 百联中环店 (2026-04-19)');

  } catch (error) {
    console.error('导入失败:', error);
  } finally {
    await connection.end();
  }
}

main();
