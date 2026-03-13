import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDailySalesData, getTodayExcelFiles } from '@/lib/email-service';

// 禁用静态生成，标记为动态路由
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 获取当日销售数据
    const { excelData, totalSalesSum, date } = await getDailySalesData();
    
    // 获取Excel文件路径
    const { dailyExcelPath, monthlyExcelPath } = await getTodayExcelFiles();
    
    // 创建邮件主题
    const today = new Date().toLocaleDateString('zh-CN');
    const subject = `${today}总销售额为${totalSalesSum.toFixed(2)}`;
    
    // 创建邮件内容（表格形式）
    let emailContent = '<h2>当日销售数据</h2>';
    emailContent += '<table border="1" style="border-collapse: collapse; width: 100%;">';
    
    // 表头
    const headers = excelData[0];
    emailContent += '<thead><tr>';
    headers.forEach((header: string) => {
      emailContent += `<th style="padding: 8px; text-align: left;">${header}</th>`;
    });
    emailContent += '</tr></thead>';
    
    // 表格内容
    emailContent += '<tbody>';
    for (let i = 1; i < excelData.length; i++) {
      const row = excelData[i];
      emailContent += '<tr>';
      row.forEach((cell: any) => {
        emailContent += `<td style="padding: 8px;">${cell}</td>`;
      });
      emailContent += '</tr>';
    }
    emailContent += '</tbody></table>';

    // 检查是否配置了邮箱认证信息
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json({ 
        success: false, 
        message: '请配置邮箱认证信息 EMAIL_USER 和 EMAIL_PASS 环境变量' 
      }, { status: 500 });
    }

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: 'smtp.163.com', // 163邮箱SMTP服务器
      port: 465, // 163邮箱SSL端口
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // 邮箱授权码，不是密码
      },
    });

    // 邮件配置
    const mailOptions = {
      from: `"销售报表系统" <${process.env.EMAIL_USER}>`, // 发件人
      to: process.env.EMAIL_TO || 'enchl@163.com,enchl_25hour@163.com', // 默认收件人
      cc: process.env.EMAIL_CC || '', // 抄送（如果有）
      subject: subject, // 主题
      html: emailContent, // HTML内容
      attachments: [] as any[] // 附件
    };

    // 添加附件
    if (dailyExcelPath) {
      mailOptions.attachments.push({
        filename: `dailysales${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`,
        path: dailyExcelPath
      });
    }
    
    if (monthlyExcelPath) {
      mailOptions.attachments.push({
        filename: `monthlysales_${new Date().getFullYear()}_${(new Date().getMonth() + 1).toString().padStart(2, '0')}.xlsx`,
        path: monthlyExcelPath
      });
    }

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    
    console.log('邮件发送成功:', info.messageId);
    
    return NextResponse.json({ 
      success: true, 
      message: '邮件发送成功', 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('邮件发送失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: '邮件发送失败', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}