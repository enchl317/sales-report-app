CREATE DATABASE IF NOT EXISTS sales_report_db;
USE sales_report_db;

-- 用户表（添加手机号字段）
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('staff', 'manager', 'admin') DEFAULT 'staff',
  name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 门店表（包含门店简称）
CREATE TABLE IF NOT EXISTS stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 销售报告表
CREATE TABLE IF NOT EXISTS sales_reports (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  report_date DATE NOT NULL,
  total_sales DECIMAL(10, 2) NOT NULL,
  cash_sales DECIMAL(10, 2) DEFAULT 0,
  card_sales DECIMAL(10, 2) DEFAULT 0,
  online_sales DECIMAL(10, 2) DEFAULT 0,
  customer_count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  UNIQUE KEY unique_store_date (store_id, report_date)
);

-- 插入初始用户数据（添加手机号字段）
DELETE FROM users;

INSERT INTO users (id, username, password_hash, role, name, phone) VALUES
(1, 'yanwh', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '严伟华', '15800717537'), 
(2, 'chenjy', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '陈讲艳', '13761365378'), 
(3, 'zhaoj', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '赵璟', '18917873948'), 
(4, 'nidp', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '倪冬平', '13816494694'), 
(5, 'sunp', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '孙萍', '15800813772'), 
(6, 'chenjj', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '陈娇娇', '15001772736'), 
(7, 'fanxp', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '范新平', '18762216262'), 
(8, 'tanza', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '谭珍爱', '13661522986'), 
(9, 'tanh', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '谭辉', '18758933941'), 
(10, 'liqq', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '李琴琴', '15900488732'), 
(11, 'cheny', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '陈云', '13501747392'), 
(12, 'liangqz', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'staff', '梁庆珍', '13817965270'), 
(13, 'admin', '$2b$10$8K1Kl2k3j4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1', 'admin', '系统管理员', '13917465128')
ON DUPLICATE KEY UPDATE
username = VALUES(username),
password_hash = VALUES(password_hash),
role = VALUES(role),
name = VALUES(name),
phone = VALUES(phone);

-- 插入门店数据（更新后的门店信息）
INSERT INTO stores (id, name, short_name, address) VALUES
(1, '南京东路第一食品', '南东店', '上海市黄浦区南京东路720号臻选坊专柜第一食品二楼'),
(2, '三鑫世界商厦店', '三鑫店', '上海市浦东新区三鑫世界商厦一层厨师专柜'),
(3, '汇联商厦店', '汇联店', '上海市徐汇区天钥桥路40号汇联商厦一楼'),
(4, '全国土特产店', '全土店', '上海市黄浦区淮海中路491号厨师专柜全国土特产食品'),
(5, '五角场店', '杨浦店', '上海市杨浦区邯郸路600号万达商业广场第一食品厨师专柜'),
(6, '百联中环店', '百联店', '上海市普陀区百联中环购物广场B区一层第一食品专柜')
ON DUPLICATE KEY UPDATE
name = VALUES(name),
short_name = VALUES(short_name),
address = VALUES(address);