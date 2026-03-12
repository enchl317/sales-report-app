// src/lib/auth.ts
import { query } from './db';

export interface User {
  id: number;
  username: string;
  role: 'staff' | 'manager' | 'admin';
  name?: string;
  phone?: string;
}

export interface Store {
  id: number;
  name: string;
  short_name: string;
  address?: string;
}

export const login = async (username: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
  try {
    // 从数据库查询用户
    const users = await query(
      'SELECT id, username, role, name, phone FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return { success: false, error: '用户名不存在' };
    }
    
    const user = users[0];
    
    // 验证密码（这里简化处理，实际应用中需要使用加密密码）
    const isValidPassword = password === 'password123' || username === 'admin';
    
    if (!isValidPassword) {
      return { success: false, error: '密码错误' };
    }
    
    // 生成模拟token
    const token = `mock_token_${user.id}_${Date.now()}`;
    
    return { 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name,
        phone: user.phone
      }, 
      token 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: '登录失败，请稍后重试' };
  }
};

export const validateToken = (token: string): User | null => {
  if (!token.startsWith('mock_token_')) {
    return null;
  }
  
  const parts = token.split('_');
  if (parts.length < 3) {
    return null;
  }
  
  return null; // 简化实现，实际应用中需要从token中提取用户信息并验证
};

export const getCurrentUser = (token: string): User | null => {
  return validateToken(token);
};

export const hasPermission = (user: User, requiredRole: User['role']): boolean => {
  const roles = ['staff', 'manager', 'admin'];
  return roles.indexOf(user.role) >= roles.indexOf(requiredRole);
};

export const getUserStores = async (userId: number): Promise<Store[]> => {
  try {
    const stores = await query(
      `SELECT s.id, s.name, s.short_name, s.address 
       FROM stores s 
       INNER JOIN user_stores us ON s.id = us.store_id 
       WHERE us.user_id = ? 
       ORDER BY s.id`,
      [userId]
    );
    return stores;
  } catch (error) {
    console.error('获取用户门店失败:', error);
    return [];
  }
};