import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

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

function initializePool() {
  if (pool) {
    return;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'enchl',
    password: process.env.DB_PASSWORD || '12345678',
    database: process.env.DB_NAME || 'sales_report_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
    idleTimeout: 60000,
  });

  console.log('数据库连接池已初始化');
}

async function rebuildPool(): Promise<void> {
  console.log('正在重建数据库连接池...');

  if (pool) {
    try {
      await pool.end();
      console.log('旧连接池已关闭');
    } catch (error) {
      console.error('关闭旧连接池时出错:', error);
    }
  }

  pool = null;
  initializePool();
  console.log('数据库连接池重建完成');
}

async function getConnection() {
  if (!pool) {
    initializePool();
  }

  const connection = await pool!.getConnection();
  return connection;
}

async function executeQuery<T>(sql: string, params?: any[]): Promise<T> {
  let retries = 3;
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    let connection: mysql.PoolConnection | null = null;

    try {
      if (!pool) {
        initializePool();
      }

      connection = await pool!.getConnection();

      try {
        const [rows] = await connection.query(sql, params);
        return rows as T;
      } finally {
        if (connection) {
          connection.release();
        }
      }
    } catch (error) {
      lastError = error;

      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          // 忽略释放错误
        }
      }

      if (isConnectionError(error)) {
        console.error(`数据库连接错误 (尝试 ${attempt + 1}/${retries}):`, error);

        if (attempt < retries - 1) {
          const delay = Math.min(Math.pow(2, attempt) * 500, 3000);
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          await rebuildPool();
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}

export async function query(sql: string, params?: any[]): Promise<any[]> {
  try {
    const rows = await executeQuery(sql, params);
    return rows as any[];
  } catch (error) {
    console.error('查询执行失败:', error);
    throw error;
  }
}

export async function transaction<T>(
  transactionCallback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  let retries = 3;
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    let connection: mysql.PoolConnection | null = null;

    try {
      if (!pool) {
        initializePool();
      }

      connection = await pool!.getConnection();
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

      if (isConnectionError(error)) {
        console.error(`事务连接错误 (尝试 ${attempt + 1}/${retries}):`, error);

        if (attempt < retries - 1) {
          const delay = Math.min(Math.pow(2, attempt) * 500, 3000);
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          await rebuildPool();
          continue;
        }
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

  throw lastError;
}

export async function checkConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1');
    return result != null;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('数据库连接池已关闭');
    } catch (error) {
      console.error('关闭连接池时出错:', error);
    }
  }
}

initializePool();

setInterval(async () => {
  try {
    const isHealthy = await checkConnection();
    if (isHealthy) {
      console.log('数据库连接健康检查通过');
    } else {
      console.log('数据库连接健康检查失败，准备重建...');
      await rebuildPool();
    }
  } catch (error) {
    console.error('健康检查出错，准备重建连接池:', error);
    try {
      await rebuildPool();
    } catch (rebuildError) {
      console.error('重建连接池失败:', rebuildError);
    }
  }
}, 20000);

export { pool, rebuildPool };