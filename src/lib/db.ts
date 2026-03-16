import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'enchl',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'sales_report_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  // 连接池配置
  waitForConnections: true,
  connectionLimit: 10,        // 最大连接数
  queueLimit: 0,             // 连接队列限制，0表示无限制
  acquireTimeout: 60000,     // 获取连接超时时间（毫秒）
  timeout: 60000,            // 查询超时时间（毫秒）
  reconnect: true,           // 自动重连
  // 防止连接超时的配置
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

class DatabaseManager {
  private pool: mysql.Pool | null = null;

  async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      this.pool = mysql.createPool(dbConfig);
    }
    return this.pool;
  }

  async resetPool(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch (error) {
        console.error('关闭连接池时出错:', error);
      }
      this.pool = null;
    }
  }
}

const dbManager = new DatabaseManager();

/**
 * 执行数据库查询
 * @param sql SQL查询语句
 * @param params 查询参数
 * @returns Promise<any[]>
 */
export async function query(sql: string, params?: any[]): Promise<any[]> {
  const pool = await dbManager.getPool();
  
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  } catch (error) {
    console.error('数据库查询错误:', error);
    // 如果是连接相关错误，尝试重建连接池
    if (error instanceof Error && 
        (error.message.includes('connection') || 
         error.message.includes('timeout') ||
         error.message.includes('closed'))) {
      console.log('检测到连接错误，正在重建连接池...');
      await dbManager.resetPool();
    }
    throw error;
  }
}

/**
 * 执行事务
 * @param transactionCallback 事务回调函数
 * @returns Promise<any>
 */
export async function transaction<T>(transactionCallback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const pool = await dbManager.getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await transactionCallback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('事务执行失败，已回滚:', error);
    throw error;
  } finally {
    connection.release(); // 释放连接回连接池
  }
}