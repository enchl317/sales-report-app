// src/lib/init-app.ts
import { startScheduledTasks } from './scheduled-tasks';

let initialized = false;

export function initializeApp() {
  if (!initialized) {
    console.log('正在初始化应用...');
    startScheduledTasks();
    initialized = true;
  }
}

// 如果直接运行此文件，则启动应用
if (require.main === module) {
  initializeApp();
}