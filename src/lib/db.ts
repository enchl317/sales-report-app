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

// 初始化连接池
function initializePool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'enchl',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'sales_report_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: 10,
    acquireTimeout: 60000,        // 获取连接的超时时间
    timeout: 60000,              // 查询超时时间
    queueLimit: 0,               // 无限制排队
    enableKeepAlive: true,       // 启用长连接
    keepAliveInitialDelay: 0,    // 保持连接初始延迟
    reconnect: true,             // 自动重连
    // MySQL特定配置
    connectTimeout: 60000,       // 连接超时
    acquireTimeout: 60000,       // 获取连接超时
    timeout: 60000,              // 查询超时
    charset: 'utf8mb4',
    // 连接池配置
    idleTimeout: 60000,          // 空闲连接超时时间
    maxIdle: 10,                 // 最大空闲连接数
    // 防止连接被MySQL服务器关闭
    pingInterval: 20000,         // ping间隔（毫秒）
  });
}

// 重建连接池
async function rebuildPool(): Promise<mysql.Pool> {
  console.log('正在重建数据库连接池...');

  if (pool) {
    try {
      await pool.end();
      console.log('旧连接池已关闭');
    } catch (error) {
      console.error('关闭旧连接池时出错:', error);
    }
  }

  pool = initializePool();
  console.log('数据库连接池重建完成');
  return pool;
}

// 获取连接池，如果不存在则初始化
async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = initializePool();
  }
  return pool;
}

// 查询函数，具有自动重试和连接恢复功能
export async function query(sql: string, params?: any[]): Promise<any[]> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const pool = await getPool();
      const [rows] = await pool.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error(`数据库查询错误 (尝试 ${attempts + 1}/${maxAttempts}):`, error);

      if (isConnectionError(error)) {
        console.log('检测到连接错误，正在重建连接池...');
        await rebuildPool();

        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
        attempts++;
        continue;
      }

      throw error;
    }
  }

  throw new Error('数据库查询失败，已达到最大重试次数');
}

// 事务函数，具有自动重试和连接恢复功能
export async function transaction<T>(
  transactionCallback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    let connection: mysql.PoolConnection | null = null;

    try {
      const pool = await getPool();
      connection = await pool.getConnection();

      await connection.beginTransaction();

      const result = await transactionCallback(connection);

      await connection.commit();
      return result;
    } catch (error) {
      console.error(`数据库事务错误 (尝试 ${attempts + 1}/${maxAttempts}):`, error);

      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('事务回滚失败:', rollbackError);
        }
      }

      if (isConnectionError(error)) {
        console.log('检测到连接错误，正在重建连接池...');
        await rebuildPool();

        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
        attempts++;
        continue;
      }

      throw error;
    } finally {
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error('释放连接时出错:', releaseError);
        }
      }
    }
  }

  throw new Error('数据库事务失败，已达到最大重试次数');
}

// 检查连接是否正常
export async function checkConnection(): Promise<boolean> {
  try {
    const pool = await getPool();
    const [result] = await pool.execute('SELECT 1 as alive');
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

// 定期健康检查，防止连接因长时间不活动而被关闭
setInterval(async () => {
  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      console.log('数据库连接异常，正在重建连接池...');
      await rebuildPool();
    } else {
      console.log('数据库连接健康检查通过');
    }
  } catch (error) {
    console.error('健康检查出错:', error);
    try {
      await rebuildPool();
    } catch (rebuildError) {
      console.error('重建连接池失败:', rebuildError);
    }
  }
}, 30000); // 每30秒检查一次

export { pool };