import mysql from 'mysql2/promise';

// 使用连接池来管理数据库连接，解决长时间运行后连接断开的问题
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'enchl',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'sales_report_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  // 连接池配置
  connectionLimit: 10,        // 最大连接数
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
  'MySQL server has gone away',
  'Connection lost during query',
  'Invalid Connection after sleep'
];

function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    return connectionErrors.some(err => 
      error.message.toLowerCase().includes(err.toLowerCase())
    );
  }
  return false;
}

// 重试函数，用于处理连接错误
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`数据库操作错误 (尝试 ${attempt + 1}/${retries + 1}):`, error);
      
      if (isConnectionError(error)) {
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 5000); // 指数退避，最多5秒
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
  
  throw new Error('操作失败，已达到最大重试次数');
}

// 查询函数，包含连接验证
export async function query(sql: string, params?: any[]): Promise<any[]> {
  return executeWithRetry(async () => {
    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  });
}

// 事务函数，包含连接验证
export async function transaction<T>(
  transactionCallback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  return executeWithRetry(async () => {
    let connection: mysql.PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      
      const result = await transactionCallback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      console.error(`事务执行错误:`, error);
      
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('事务回滚失败:', rollbackError);
        }
      }
      
      throw error;
    } finally {
      if (connection) {
        connection.release(); // 释放连接回连接池
      }
    }
  });
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
    // 尝试获取连接并验证
    const connection = await pool.getConnection();
    try {
      await connection.query('SELECT 1');
      console.log('数据库连接健康检查通过');
    } finally {
      connection.release(); // 确保连接被释放
    }
  } catch (error) {
    console.error('数据库连接健康检查失败:', error);
  }
}, 30000); // 每30秒检查一次