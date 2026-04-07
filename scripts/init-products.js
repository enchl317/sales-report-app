// scripts/init-products.js
const mysql = require('mysql2/promise');

async function initProducts() {
  try {
    console.log('正在连接到 MySQL 服务器...');
    
    // 首先连接到 MySQL 服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'enchl',
      password: process.env.DB_PASSWORD || '12345678',
      port: parseInt(process.env.DB_PORT) || 3306
    });
    
    console.log('连接成功，正在选择数据库...');
    
    // 选择数据库
    await connection.query('USE sales_report_db;');
    
    console.log('正在创建商品表...');
    
    // 创建商品表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL COMMENT '商品名称',
        code VARCHAR(100) DEFAULT NULL COMMENT '商品代码',
        category ENUM('半成品', '熟制品', '肉干与其它', '耗材') NOT NULL COMMENT '品类',
        specification VARCHAR(100) DEFAULT NULL COMMENT '规格',
        unit VARCHAR(50) DEFAULT NULL COMMENT '单位',
        sort_order INT DEFAULT 0 COMMENT '商品排序',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    console.log('商品表创建成功，正在插入初始商品数据...');
    
    // 定义初始商品数据
    const productsData = [
      [1, '半成品', '99810000', '儿童营养猪肉酥（半成品）-CS', '2.5*4', '公斤'],
      [2, '半成品', '99810001', '海苔猪肉酥（半成品）-CS', '2.5*4', '公斤'],
      [3, '半成品', '99810002', '金丝猪肉松（半成品）-CS', '2.5*4', '公斤'],
      [4, '半成品', null, '每日拌饭猪肉酥', null, null],
      [5, '熟制品', '99810017', '儿童营养猪肉酥（现制现售）', null, '公斤'],
      [6, '熟制品', '99810018', '海苔猪肉酥（现制现售）', null, '公斤'],
      [7, '熟制品', '99810019', '金丝猪肉松（现制现售）', null, '公斤'],
      [8, '熟制品', null, '高汤猪肉松（裸装）', '1*10', '公斤'],
      [9, '熟制品', '99810003', '无糖猪肉酥-CS', '1*10', '公斤'],
      [10, '熟制品', '99810007', '225G无糖猪肉酥-CS', '12', '罐'],
      [11, '熟制品', null, '118g原味猪肉酥', '24', '罐'],
      [12, '熟制品', null, '280g高汤猪肉松', '12', '罐'],
      [13, '熟制品', null, '香酥猪肉酥', null, null],
      [14, '熟制品', null, '特制猪肉酥', null, null],
      [15, '肉干与其它', '99810111', '原汁碎肉脯', '1*6', '公斤'],
      [16, '肉干与其它', null, '猪脆脆（岩烧猪肉脯）', null, null],
      [17, '肉干与其它', null, '黑色原切猪肉脯', '1*10', '公斤'],
      [18, '肉干与其它', null, '原切猪肉脯', null, null],
      [19, '肉干与其它', null, '古早猪肉脯', null, null],
      [20, '肉干与其它', null, '炭烧猪肉脯', null, null],
      [21, '肉干与其它', null, '港式猪肉脯', null, null],
      [22, '肉干与其它', null, '原切特级猪肉脯（原味）', '1*10', '公斤'],
      [23, '肉干与其它', null, '原切特级猪肉脯（黑胡椒味）', '1*10', '公斤'],
      [24, '肉干与其它', null, '鳕鱼圆片', null, null],
      [25, '肉干与其它', null, '鳕鱼鱼松', null, null],
      [26, '肉干与其它', null, '三文鱼鱼松', null, null],
      [27, '肉干与其它', null, '金枪鱼鱼松', null, null],
      [28, '肉干与其它', null, '五香牛肉干', '1*5', '公斤'],
      [51, '耗材', '99880017', '油', null, '桶'],
      [52, '耗材', null, '厨师自封袋（小号）', '100', '个'],
      [53, '耗材', null, '厨师上海地标自封袋（大号）', '100', '个'],
      [54, '耗材', null, '厨师马夹袋（大号）', '100', '个'],
      [55, '耗材', null, '厨师礼盒', '100', '个'],
      [56, '耗材', null, '厨师上海地标牛皮纸礼袋', '200', '个'],
      [57, '耗材', null, '厨师无纺布袋（大）', '100', '个']
    ];
    
    // 插入初始商品数据
    for (const productData of productsData) {
      await connection.query(`
        INSERT INTO products 
        (sort_order, category, code, name, specification, unit)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        category = VALUES(category),
        code = VALUES(code),
        name = VALUES(name),
        specification = VALUES(specification),
        unit = VALUES(unit),
        sort_order = VALUES(sort_order)
      `, productData);
    }
    
    console.log('初始商品数据插入完成！');
    
    // 显示插入的商品数据
    const [rows] = await connection.query('SELECT * FROM products ORDER BY sort_order ASC;');
    console.log('当前商品列表:');
    console.table(rows);
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('商品数据初始化失败:', error);
  }
}

initProducts();