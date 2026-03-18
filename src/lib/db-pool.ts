import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'enchl',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'sales_report_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+08:00',
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  // 连接池配置
  connectionLimit: 10,        // 最大连接数
  queueLimit: 0,             // 最大排队数，0表示无限制
  acquireTimeout: 60000,     // 获取连接的超时时间
  connectTimeout: 60000,     // 连接超时
  timeout: 60000,            // 查询超时时间
  reconnect: true,           // 自动重连
  // 连接空闲超时时间，防止连接被MySQL服务器关闭
  idleTimeout: 60000,        // 60秒空闲超时
  // MySQL连接配置
  enableKeepAlive: true,
});

// 定义可能的连接错误
const connectionErrors = [
  'connection',
  'timeout',
  'closed',
  'ECONNRESET',
  'PROTOCOL_CONNECTION_LOST',
  'read ECONNRESET',
  'write ECONNRESET',
  'Handshake',
  'connect ETIMEDOUT',
  'connect ECONNREFUSED',
  'Unable to set initial connection',
  'This socket has been ended by the other party',
  "Can't add new command when connection is in closed state",
  'Connection lost:',
  'Fatal error encountered during command execution',
  'PROTOCOL_ENQUEUE_AFTER_QUIT',
  'PROTOCOL_ENQUEUE_ALREADY_IN_USE',
  'Lost connection',
  'Deadlock found when trying to get lock',
];

function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    return connectionErrors.some(err => error.message.toLowerCase().includes(err.toLowerCase()));
  }
  return false;
}

export async function query(sql: string, params?: any[], retries: number = 3): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error(`数据库查询错误 (尝试 ${attempt + 1}/${retries + 1}):`, error);
      
      if (isConnectionError(error)) {
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 5000); // 指数退避，最多5秒
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('查询失败，已达到最大重试次数');
}

export async function transaction<T>(
  transactionCallback: (connection: mysql.PoolConnection) => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let connection: mysql.PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      
      const result = await transactionCallback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      console.error(`事务执行错误 (尝试 ${attempt + 1}/${retries + 1}):`, error);
      
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('事务回滚失败:', rollbackError);
        }
      }
      
      if (isConnectionError(error)) {
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 5000);
          console.log(`等待 ${delay}ms 后重试事务...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } finally {
      if (connection) {
        connection.release(); // 释放连接回连接池
      }
    }
  }
  
  throw new Error('事务失败，已达到最大重试次数');
}

export async function checkConnection(): Promise<boolean> {
  try {
    const [rows] = await pool.execute('SELECT 1');
    return rows != null;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (error) {
    console.error('关闭连接池时出错:', error);
  }
}

// 定期ping连接以保持活跃
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('数据库连接健康检查通过');
  } catch (error) {
    console.error('数据库连接健康检查失败:', error);
  }
}, 30000); // 每30秒检查一次