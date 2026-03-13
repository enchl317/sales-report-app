import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename;
    
    // 验证文件名安全性
    if (!filename.match(/^[a-zA-Z0-9_-]+\.(xlsx|xls)$/)) {
      return new Response('Invalid file name', { status: 400 });
    }
    
    const filePath = path.join(process.cwd(), 'report', filename);
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }
    
    // 读取文件
    const fileBuffer = await fs.readFile(filePath);
    
    // 返回文件
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString()
      }
    });
  } catch (error) {
    console.error('下载Excel失败:', error);
    return new Response('Download failed', { status: 500 });
  }
}