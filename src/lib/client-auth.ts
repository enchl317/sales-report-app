// src/lib/client-auth.ts
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
    // 这里我们通过API调用来验证用户
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (result.success) {
      return result;
    } else {
      return { success: false, error: result.message || '登录失败' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: '登录失败，请稍后重试' };
  }
};

export const validateToken = (token: string): User | null => {
  if (!token || !token.startsWith('mock_token_')) {
    return null;
  }
  
  const parts = token.split('_');
  if (parts.length < 3) {
    return null;
  }
  
  // 从token中解析用户信息（在实际应用中，这应该是解码JWT的过程）
  try {
    const userId = parseInt(parts[2]);
    // 这里我们只是简单地从token中提取用户ID，实际应用中应验证token的有效性
    // 为了获取完整的用户信息，我们需要调用API
    return null; // 简化实现
  } catch (e) {
    return null;
  }
};

export const getCurrentUser = (token?: string): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const authToken = token || localStorage.getItem('authToken');
  if (!authToken) {
    return null;
  }
  
  // 从本地存储中获取用户信息
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  
  if (!userRole || !userId || !username) {
    return null;
  }
  
  return {
    id: parseInt(userId),
    username,
    role: userRole as 'staff' | 'manager' | 'admin',
  };
};

export const hasPermission = (user: User, requiredRole: User['role']): boolean => {
  const roles = ['staff', 'manager', 'admin'];
  return roles.indexOf(user.role) >= roles.indexOf(requiredRole);
};