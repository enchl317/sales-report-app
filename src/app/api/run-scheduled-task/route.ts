import { NextResponse } from 'next/server';
import { runOnce } from '@/lib/scheduled-tasks';

export async function POST() {
  try {
    await runOnce();
    return NextResponse.json({ 
      success: true, 
      message: '定时任务已手动执行完成' 
    });
  } catch (error) {
    console.error('手动执行定时任务失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: '手动执行失败', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}