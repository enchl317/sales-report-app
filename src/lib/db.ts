import mysql from 'mysql2/promise';

const dbConfig = {
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
  connectTimeout: 30000,
  readTimeout: 30000,
  writeTimeout: 30000,
  // 关键：禁用长连接，使用短连接
  acquireTimeout: 10000,
  timeout: 30000,
};

async function createConnection(): Promise<mysql.Connection> {
  return await mysql.createConnection(dbConfig);
}

async function closeConnection(connection: mysql.Connection | null): Promise<void> {
  if (connection) {
    try {
      await connection.end();
    } catch (error) {
      console.error('关闭连接时出错:', error);
    }
  }
}

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
];

function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    return connectionErrors.some(err => error.message.includes(err));
  }
  return false;
}

export async function query(sql: string, params?: any[], retries: number = 3): Promise<any[]> {
  let connection: mysql.Connection | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    connection = null;
    
    try {
      connection = await createConnection();
      const [rows] = await connection.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error(`数据库查询错误 (尝试 ${attempt + 1}/${retries + 1}):`, error);
      
      if (isConnectionError(error)) {
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 500, 3000);
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } finally {
      await closeConnection(connection);
    }
  }
  
  throw new Error('查询失败，已达到最大重试次数');
}

export async function transaction<T>(
  transactionCallback: (connection: mysql.Connection) => Promise<T>,
  retries: number = 3
): Promise<T> {
  let connection: mysql.Connection | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    connection = null;
    
    try {
      connection = await createConnection();
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
          const delay = Math.min(Math.pow(2, attempt) * 500, 3000);
          console.log(`等待 ${delay}ms 后重试事务...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } finally {
      await closeConnection(connection);
    }
  }
  
  throw new Error('事务失败，已达到最大重试次数');
}

export async function checkConnection(): Promise<boolean> {
  let connection: mysql.Connection | null = null;
  try {
    connection = await createConnection();
    const [rows] = await connection.execute('SELECT 1');
    return rows != null;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  } finally {
    await closeConnection(connection);
  }
}

export async function closePool(): Promise<void> {
  console.log('当前使用独立连接模式，无需关闭连接池');
}