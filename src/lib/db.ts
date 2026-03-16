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
  maxIdle: 5,                // 最大空闲连接数
  queueLimit: 0,             // 连接队列限制，0表示无限制
  acquireTimeout: 60000,     // 获取连接超时时间（毫秒）
  timeout: 60000,            // 查询超时时间（毫秒）
  reconnect: true,           // 自动重连
  // 防止连接超时的配置
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 连接健康检查
  pingInterval: 30000,       // 每30秒ping一次连接
  // 连接池清理
  idleTimeout: 60000,        // 空闲连接超时时间
  createTimeout: 30000,      // 创建连接超时时间
  destroyTimeout: 5000,      // 销毁连接超时时间
};

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private lastResetTime: number = 0;
  private readonly resetCooldown: number = 5000; // 5秒冷却时间

  async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      this.pool = mysql.createPool(dbConfig);
    }
    return this.pool;
  }

  async resetPoolIfNeeded(error?: Error): Promise<void> {
    // 检查是否在冷却时间内
    const now = Date.now();
    if (now - this.lastResetTime < this.resetCooldown) {
      console.log('连接池重置在冷却时间内，跳过重置');
      return;
    }

    if (this.pool) {
      console.log('正在关闭现有连接池...');
      try {
        // 先尝试优雅关闭
        await this.pool.end();
        console.log('连接池已关闭');
      } catch (closeError) {
        console.error('关闭连接池时出错:', closeError);
      } finally {
        this.pool = null;
        this.lastResetTime = Date.now();
      }
    }
  }

  // 测试连接是否可用
  async testConnection(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }
}

const dbManager = new DatabaseManager();

/**
 * 执行数据库查询，带重试机制
 * @param sql SQL查询语句
 * @param params 查询参数
 * @param retries 重试次数，默认3次
 * @returns Promise<any[]>
 */
export async function query(sql: string, params?: any[], retries: number = 3): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const pool = await dbManager.getPool();
      const [rows] = await pool.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error(`数据库查询错误 (尝试 ${attempt + 1}/${retries + 1}):`, error);
      
      // 检查是否是连接相关错误
      if (error instanceof Error && 
          (error.message.includes('connection') || 
           error.message.includes('timeout') ||
           error.message.includes('closed') ||
           error.message.includes('ECONNRESET') ||
           error.message.includes('PROTOCOL_CONNECTION_LOST') ||
           error.message.includes('read ECONNRESET') ||
           error.message.includes('write ECONNRESET'))) {
        
        if (attempt < retries) {
          console.log(`等待1秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 尝试重置连接池
          if (attempt >= Math.floor(retries / 2)) { // 在一半尝试后重置连接池
            await dbManager.resetPoolIfNeeded(error);
          }
        } else {
          // 最后一次尝试失败，重置连接池
          await dbManager.resetPoolIfNeeded(error);
          throw error;
        }
      } else {
        // 非连接错误，直接抛出
        throw error;
      }
    }
  }
  
  throw new Error('查询失败，已达到最大重试次数');
}

/**
 * 执行事务，带重试机制
 * @param transactionCallback 事务回调函数
 * @param retries 重试次数，默认3次
 * @returns Promise<any>
 */
export async function transaction<T>(transactionCallback: (connection: mysql.PoolConnection) => Promise<T>, retries: number = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const pool = await dbManager.getPool();
    let connection: mysql.PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const result = await transactionCallback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      console.error(`事务执行错误 (尝试 ${attempt + 1}/${retries + 1}):`, error);
      
      // 发生错误时尝试回滚
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('事务回滚失败:', rollbackError);
        }
      }
      
      // 检查是否是连接相关错误
      if (error instanceof Error && 
          (error.message.includes('connection') || 
           error.message.includes('timeout') ||
           error.message.includes('closed') ||
           error.message.includes('ECONNRESET') ||
           error.message.includes('PROTOCOL_CONNECTION_LOST') ||
           error.message.includes('read ECONNRESET') ||
           error.message.includes('write ECONNRESET'))) {
        
        if (attempt < retries) {
          console.log(`等待1秒后重试事务...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 尝试重置连接池
          if (attempt >= Math.floor(retries / 2)) {
            await dbManager.resetPoolIfNeeded(error);
          }
        } else {
          await dbManager.resetPoolIfNeeded(error);
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

/**
 * 检查数据库连接状态
 * @returns Promise<boolean>
 */
export async function checkConnection(): Promise<boolean> {
  return await dbManager.testConnection();
}