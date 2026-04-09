// src/components/NavigationMenu.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationMenu() {
  const pathname = usePathname();

  const tabs = [
    { key: '/', title: '填报', href: '/' },
    { key: '/sales-submit', title: '销售上报', href: '/sales-submit' },
    { key: '/history', title: '历史', href: '/history' },
    { key: '/stats', title: '统计', href: '/stats' },
    { key: '/store-purchase', title: '进货', href: '/store-purchase' },
    { key: '/inventory-count', title: '盘点', href: '/inventory-count' },
    { key: '/store-transfer', title: '调拨', href: '/store-transfer' },
  ];

  // 获取用户角色，确保在客户端环境下才使用 localStorage
  const userRole = typeof window !== 'undefined' && typeof localStorage !== 'undefined' 
    ? localStorage.getItem('userRole') 
    : 'staff';
  
  // 根据用户角色决定显示哪些标签页
  let displayTabs = [...tabs]; // 默认显示所有标签页
  
  // 如果用户角色是 staff，则隐藏统计页面
  if (userRole === 'staff') {
    displayTabs = tabs.filter(tab => tab.key !== '/stats');
  }
  
  // 移除销售上报页面，因为它是一个公开页面，不应该出现在需要登录的导航中
  displayTabs = displayTabs.filter(tab => tab.key !== '/sales-submit');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      {displayTabs.map(item => (
        <Link 
          key={item.key} 
          href={item.href}
          className={`flex flex-col items-center px-4 py-1 ${
            pathname === item.key ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-lg">{item.title}</span>
        </Link>
      ))}
    </nav>
  );
}