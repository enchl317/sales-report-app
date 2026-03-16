import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'enchl',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'sales_report_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  // 连接池配置
  waitForConnections: true,
  connectionLimit: 15,        // 增加最大连接数
  maxIdle: 10,               // 增加最大空闲连接数
  queueLimit: 0,             // 连接队列限制，0表示无限制
  acquireTimeout: 30000,     // 获取连接超时时间（毫秒）- 减少超时时间
  timeout: 30000,            // 查询超时时间（毫秒）- 减少超时时间
  reconnect: true,           // 自动重连
  // 防止连接超时的配置
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 连接池清理
  idleTimeout: 30000,        // 减少空闲连接超时时间
  createTimeout: 10000,      // 创建连接超时时间
  destroyTimeout: 5000,      // 销毁连接超时时间
  // 额外配置以处理连接问题
  connectTimeout: 10000,     // 连接超时
  queueTimeout: 30000,       // 队列超时
  initializationTimeout: 10000, // 初始化超时
  pingInterval: 15000,       // 减少ping间隔
  maxPreparedStatements: 500, // 最大预处理语句数
  charset: 'utf8mb4',
  timezone: '+08:00',        // 设置时区
  dateStrings: true,         // 日期作为字符串返回
  supportBigNumbers: true,
  bigNumberStrings: true,
};

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private lastResetTime: number = 0;
  private readonly resetCooldown: number = 10000; // 增加冷却时间到10秒
  private healthCheckInterval: NodeJS.Timeout | null = null;

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
      console.log(`连接池重置在冷却时间内，跳过重置。距离下次重置还需 ${this.resetCooldown - (now - this.lastResetTime)} ms`);
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
        console.log('连接池已重置');
      }
    }
  }

  // 测试连接是否可用
  async testConnection(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute('SELECT 1 as test') as [any[], any];
      return rows && rows.length > 0;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }
  
  // 启动健康检查
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.testConnection();
        console.log('数据库连接健康检查通过');
      } catch (error) {
        console.error('数据库连接健康检查失败:', error);
      }
    }, 30000); // 每30秒检查一次
  }
  
  // 停止健康检查
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

const dbManager = new DatabaseManager();

// 启动健康检查
dbManager.startHealthCheck();

// 在应用退出时清理
process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在清理数据库连接...');
  dbManager.stopHealthCheck();
  if (dbManager['pool']) {
    dbManager['pool'].end()
      .then(() => console.log('数据库连接池已关闭'))
      .catch(err => console.error('关闭连接池时出错:', err));
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在清理数据库连接...');
  dbManager.stopHealthCheck();
  if (dbManager['pool']) {
    dbManager['pool'].end()
      .then(() => console.log('数据库连接池已关闭'))
      .catch(err => console.error('关闭连接池时出错:', err));
  }
  process.exit(0);
});

/**
 * 执行数据库查询，带重试机制和连接验证
 * @param sql SQL查询语句
 * @param params 查询参数
 * @param retries 重试次数，默认3次
 * @returns Promise<any[]>
 */
export async function query(sql: string, params?: any[], retries: number = 3): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const pool = await dbManager.getPool();
      
      // 在执行查询前验证连接
      if (attempt > 0) { // 只在重试时验证连接
        try {
          await pool.query('SELECT 1');
        } catch (validationError) {
          console.log('连接验证失败，重置连接池');
          await dbManager.resetPoolIfNeeded(validationError as Error);
          continue; // 重新获取连接池并重试
        }
      }
      
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
           error.message.includes('write ECONNRESET') ||
           error.message.includes('Handshake') ||
           error.message.includes('connect ETIMEDOUT') ||
           error.message.includes('connect ECONNREFUSED') ||
           error.message.includes('Unable to set initial connection') ||
           error.message.includes('This socket has been ended by the other party'))) {
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
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
 * 执行事务，带重试机制和连接验证
 * @param transactionCallback 事务回调函数
 * @param retries 重试次数，默认3次
 * @returns Promise<any>
 */
export async function transaction<T>(transactionCallback: (connection: mysql.PoolConnection) => Promise<T>, retries: number = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const pool = await dbManager.getPool();
    let connection: mysql.PoolConnection | null = null;
    
    try {
      // 在获取连接前验证连接池
      if (attempt > 0) {
        try {
          await pool.query('SELECT 1');
        } catch (validationError) {
          console.log('连接验证失败，重置连接池');
          await dbManager.resetPoolIfNeeded(validationError as Error);
          continue; // 重新获取连接池并重试
        }
      }
      
      connection = await pool.getConnection();
      
      // 检查连接是否有效
      if (!connection) {
        throw new Error('无法获取数据库连接');
      }
      
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
           error.message.includes('write ECONNRESET') ||
           error.message.includes('Handshake') ||
           error.message.includes('connect ETIMEDOUT') ||
           error.message.includes('connect ECONNREFUSED') ||
           error.message.includes('Unable to set initial connection') ||
           error.message.includes('This socket has been ended by the other party'))) {
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          console.log(`等待 ${delay}ms 后重试事务...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
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
        try {
          connection.release(); // 释放连接回连接池
        } catch (releaseError) {
          console.error('释放连接时出错:', releaseError);
        }
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

/**
 * 关闭数据库连接池
 * @returns Promise<void>
 */
export async function closePool(): Promise<void> {
  dbManager.stopHealthCheck();
  if (dbManager['pool']) {
    try {
      await dbManager['pool'].end();
      console.log('数据库连接池已关闭');
    } catch (error) {
      console.error('关闭连接池时出错:', error);
    } finally {
      dbManager['pool'] = null;
    }
  }
}