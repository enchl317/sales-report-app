import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'enchl',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'sales_report_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  // 连接池配置
  waitForConnections: true,
  connectionLimit: 5,         // 减少连接数，避免过多连接导致问题
  maxIdle: 3,                 // 减少最大空闲连接数
  queueLimit: 0,              // 连接队列限制，0表示无限制
  acquireTimeout: 30000,      // 获取连接超时时间（毫秒）
  timeout: 30000,             // 查询超时时间（毫秒）
  reconnect: true,            // 自动重连
  // 防止连接超时的配置
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 连接池清理
  idleTimeout: 20000,         // 缩短空闲连接超时时间
  createTimeout: 10000,       // 创建连接超时时间
  destroyTimeout: 5000,       // 销毁连接超时时间
  // 额外配置以处理连接问题
  connectTimeout: 10000,      // 连接超时
  queueTimeout: 30000,        // 队列超时
  initializationTimeout: 10000, // 初始化超时
  charset: 'utf8mb4',
  timezone: '+08:00',         // 设置时区
  dateStrings: true,          // 日期作为字符串返回
  supportBigNumbers: true,
  bigNumberStrings: true,
  // 重要：禁用连接池内部的自动ping，避免冲突
  pingInterval: undefined,
  // 重要：设置合理的超时值
  readTimeout: 30000,
  writeTimeout: 30000,
};

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private lastResetTime: number = 0;
  private readonly resetCooldown: number = 2000; // 缩短冷却时间到2秒
  private connectionCounter: number = 0; // 连接计数器，用于跟踪连接使用情况

  constructor() {
    // 应用程序启动时初始化连接池
    this.initializePool();
  }

  private initializePool(): void {
    try {
      this.pool = mysql.createPool(dbConfig);
      this.connectionCounter = 0;
      console.log('数据库连接池已初始化');
    } catch (error) {
      console.error('初始化连接池失败:', error);
      throw error;
    }
  }

  async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      this.initializePool();
    }
    return this.pool!;
  }

  async resetPool(): Promise<void> {
    const now = Date.now();
    if (now - this.lastResetTime < this.resetCooldown) {
      console.log(`连接池重置在冷却时间内，跳过重置。距离下次重置还需 ${this.resetCooldown - (now - this.lastResetTime)} ms`);
      return;
    }

    console.log('正在重置连接池...');
    if (this.pool) {
      try {
        await this.pool.end();
        console.log('旧连接池已关闭');
      } catch (closeError) {
        console.error('关闭旧连接池时出错:', closeError);
      } finally {
        this.pool = null;
      }
    }
    
    // 重新初始化连接池
    this.initializePool();
    this.lastResetTime = Date.now();
    console.log('连接池已重置');
  }

  // 测试连接是否可用
  async testConnection(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      // 使用更简单的查询测试连接
      const [rows] = await pool.execute('SELECT 1') as [any[], any];
      return rows && rows.length > 0;
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return false;
    }
  }
  
  // 检查连接池状态
  getConnectionStats(): { activeConnections: number, totalConnections: number } {
    if (this.pool) {
      // @ts-ignore - 访问私有属性以获取连接池状态
      const activeConnections = this.pool._allConnections?.length || 0;
      return { 
        activeConnections, 
        totalConnections: this.connectionCounter 
      };
    }
    return { activeConnections: 0, totalConnections: 0 };
  }
}

const dbManager = new DatabaseManager();

/**
 * 执行数据库查询，带重试机制和连接验证
 * @param sql SQL查询语句
 * @param params 查询参数
 * @param retries 重试次数，默认3次
 * @returns Promise<any[]>
 */
export async function query(sql: string, params?: any[], retries: number = 5): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let pool: mysql.Pool | null = null;
    
    try {
      // 在每次尝试前都获取新的连接池实例
      pool = await dbManager.getPool();
      
      // 执行查询前先测试连接，但只在重试时测试
      if (attempt > 0) {
        const isConnected = await dbManager.testConnection();
        if (!isConnected) {
          console.log('连接不可用，重置连接池');
          await dbManager.resetPool();
          pool = await dbManager.getPool(); // 重新获取连接池
        }
      }
      
      // 执行查询
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
           error.message.includes('This socket has been ended by the other party') ||
           error.message.includes('Can\'t add new command when connection is in closed state') ||
           error.message.includes('Connection lost:') ||
           error.message.includes('Fatal error encountered during command execution'))) {
        
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 500, 5000); // 最大延迟5秒，更快重试
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 如果是连接关闭错误，立即重置连接池
          if (error.message.includes('Can\'t add new command when connection is in closed state') || 
              error.message.includes('Connection lost:') ||
              error.message.includes('Fatal error encountered during command execution')) {
            await dbManager.resetPool();
          } else if (attempt >= Math.floor(retries / 2)) {
            // 在一半尝试后重置连接池
            await dbManager.resetPool();
          }
        } else {
          // 最后一次尝试失败，重置连接池
          await dbManager.resetPool();
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
export async function transaction<T>(transactionCallback: (connection: mysql.PoolConnection) => Promise<T>, retries: number = 5): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let pool: mysql.Pool | null = null;
    let connection: mysql.PoolConnection | null = null;
    
    try {
      // 在每次尝试前都获取新的连接池实例
      pool = await dbManager.getPool();
      
      // 执行事务前先测试连接，但只在重试时测试
      if (attempt > 0) {
        const isConnected = await dbManager.testConnection();
        if (!isConnected) {
          console.log('连接不可用，重置连接池');
          await dbManager.resetPool();
          pool = await dbManager.getPool(); // 重新获取连接池
        }
      }
      
      // 获取连接
      connection = await pool.getConnection();
      
      // 检查连接是否有效
      if (!connection) {
        throw new Error('无法获取数据库连接');
      }
      
      // 开始事务
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
           error.message.includes('This socket has been ended by the other party') ||
           error.message.includes('Can\'t add new command when connection is in closed state') ||
           error.message.includes('Connection lost:') ||
           error.message.includes('Fatal error encountered during command execution'))) {
        
        if (attempt < retries) {
          const delay = Math.min(Math.pow(2, attempt) * 500, 5000); // 最大延迟5秒，更快重试
          console.log(`等待 ${delay}ms 后重试事务...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 如果是连接关闭错误，立即重置连接池
          if (error.message.includes('Can\'t add new command when connection is in closed state') || 
              error.message.includes('Connection lost:') ||
              error.message.includes('Fatal error encountered during command execution')) {
            await dbManager.resetPool();
          } else if (attempt >= Math.floor(retries / 2)) {
            // 在一半尝试后重置连接池
            await dbManager.resetPool();
          }
        } else {
          await dbManager.resetPool();
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