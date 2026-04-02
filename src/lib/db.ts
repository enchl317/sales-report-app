import mysql from 'mysql2/promise';

// 存储连接池实例
let pool: mysql.Pool | null = null;

// 定义连接错误类型
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
  'Invalid Connection after sleep',
  'Connection was closed by the server',
  'Connection lost during handshake',
  'Connection lost prior to handshake'
];

function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    return connectionErrors.some(err =>
      error.message.toLowerCase().includes(err.toLowerCase())
    );
  }
  return false;
}

// 创建新的连接池
function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'enchl',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'sales_report_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: 5,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
    charset: 'utf8mb4',
  });
}

// 获取或创建连接池
async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = createPool();
    console.log('数据库连接池已创建');
  }
  return pool;
}

// 查询函数，具有完整的连接池重建功能
export async function query(sql: string, params?: any[]): Promise<any[]> {
  let lastError: any;

  // 尝试最多3次
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const currentPool = await getPool();

      // 验证连接是否可用
      const connection = await currentPool.getConnection();

      try {
        // 执行查询
        const [rows] = await connection.query(sql, params);
        return rows as any[];
      } finally {
        // 确保连接被正确释放
        try {
          connection.release();
        } catch (releaseError) {
          // 忽略释放错误
        }
      }
    } catch (error) {
      lastError = error;

      // 检查是否是连接错误
      if (isConnectionError(error)) {
        console.error(`数据库连接错误 (尝试 ${attempt + 1}/3):`, error);

        // 重建连接池
        if (pool) {
          try {
            await pool.end();
          } catch (endError) {
            console.error('关闭旧连接池失败:', endError);
          }
          pool = null;
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      // 非连接错误，直接抛出
      throw error;
    }
  }

  // 所有尝试都失败
  console.error('数据库查询失败，已达到最大重试次数:', lastError);
  throw lastError;
}

// 事务函数
export async function transaction<T>(
  transactionCallback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < 3; attempt++) {
    let connection: mysql.PoolConnection | null = null;

    try {
      const currentPool = await getPool();
      connection = await currentPool.getConnection();

      await connection.beginTransaction();

      const result = await transactionCallback(connection);
      await connection.commit();

      return result;
    } catch (error) {
      lastError = error;

      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('事务回滚失败:', rollbackError);
        }
      }

      // 检查是否是连接错误
      if (isConnectionError(error)) {
        console.error(`数据库事务连接错误 (尝试 ${attempt + 1}/3):`, error);

        // 重建连接池
        if (pool) {
          try {
            await pool.end();
          } catch (endError) {
            console.error('关闭旧连接池失败:', endError);
          }
          pool = null;
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      throw error;
    } finally {
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          // 忽略释放错误
        }
      }
    }
  }

  console.error('数据库事务失败，已达到最大重试次数:', lastError);
  throw lastError;
}

// 检查连接是否正常
export async function checkConnection(): Promise<boolean> {
  try {
    const currentPool = await getPool();
    const [result] = await currentPool.query('SELECT 1 as alive');
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error('数据库连接检查失败:', error);
    return false;
  }
}

// 关闭连接池
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      console.log('数据库连接池已关闭');
      pool = null;
    } catch (error) {
      console.error('关闭连接池时出错:', error);
    }
  }
}

// 初始化连接池
getPool();

// 定期健康检查和连接池重建
setInterval(async () => {
  try {
    // 首先检查当前连接是否正常
    const currentPool = await getPool();
    const connection = await currentPool.getConnection();

    try {
      await connection.query('SELECT 1');
      console.log('数据库连接健康检查通过');
    } catch (error) {
      console.error('健康检查失败，准备重建连接池:', error);

      // 重建连接池
      if (pool) {
        try {
          await pool.end();
        } catch (endError) {
          console.error('关闭旧连接池失败:', endError);
        }
        pool = null;
      }

      // 创建新的连接池
      pool = createPool();
      console.log('数据库连接池已重建');
    } finally {
      try {
        connection.release();
      } catch (releaseError) {
        // 忽略释放错误
      }
    }
  } catch (error) {
    console.error('健康检查出错:', error);

    // 重建连接池
    if (pool) {
      try {
        await pool.end();
      } catch (endError) {
        console.error('关闭旧连接池失败:', endError);
      }
      pool = null;
    }

    // 创建新的连接池
    pool = createPool();
    console.log('数据库连接池已重建');
  }
}, 25000); // 每25秒检查一次

export { pool };