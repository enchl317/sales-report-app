// src/app/api/store-purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const storeId = searchParams.get('storeId');
    const date = searchParams.get('date');

    let sql = `
      SELECT 
        sp.id,
        sp.document_id,
        sp.created_date,
        sp.store_id,
        s.name as store_name,
        sp.created_at,
        sp.updated_at
      FROM store_purchases sp
      LEFT JOIN stores s ON sp.store_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (storeId) {
      sql += ' AND sp.store_id = ?';
      params.push(parseInt(storeId));
    }

    if (date) {
      sql += ' AND sp.created_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY sp.created_date DESC, sp.created_at DESC';

    const storePurchases = await query(sql, params);

    return NextResponse.json({ 
      success: true, 
      storePurchases: storePurchases.map((sp: any) => ({
        id: sp.id,
        documentId: sp.document_id,
        createdDate: sp.created_date,
        storeId: sp.store_id,
        storeName: sp.store_name,
        createdAt: sp.created_at,
        updatedAt: sp.updated_at
      })) 
    });
  } catch (error) {
    console.error('获取门店进货记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取门店进货记录失败' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, createdDate, details } = body;

    if (!storeId || !createdDate || !details || !Array.isArray(details)) {
      return NextResponse.json({ 
        success: false, 
        message: '参数不完整' 
      }, { status: 400 });
    }

    // 检查当天是否已有进货记录
    const existingRecord = await query(`
      SELECT id FROM store_purchases 
      WHERE store_id = ? AND created_date = ?
    `, [storeId, createdDate]);

    let storePurchaseId: number;

    if (existingRecord.length > 0) {
      // 如果已存在，则更新记录
      storePurchaseId = existingRecord[0].id;
      
      // 删除现有的明细记录
      await query('DELETE FROM store_purchase_details WHERE store_purchase_id = ?', [storePurchaseId]);
    } else {
      // 生成单据ID (MDJH+门店id+日期)，门店ID补足两位数
      const paddedStoreId = String(storeId).padStart(2, '0');
      const documentId = `MDJH${paddedStoreId}${createdDate.replace(/-/g, '')}`;
      
      // 创建新的进货主记录
      const result: any = await query(`
        INSERT INTO store_purchases (document_id, created_date, store_id)
        VALUES (?, ?, ?)
      `, [documentId, createdDate, storeId]);
      
      storePurchaseId = result.insertId;
    }

    // 插入或更新明细记录
    for (const detail of details) {
      const { productId, productName, purchaseQuantity } = detail;
      
      if (purchaseQuantity < 0) {
        return NextResponse.json({ 
          success: false, 
          message: `商品 ${productName} 的进货数量不能为负数` 
        }, { status: 400 });
      }

      await query(`
        INSERT INTO store_purchase_details (store_purchase_id, product_id, product_name, purchase_quantity)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        product_name = VALUES(product_name),
        purchase_quantity = VALUES(purchase_quantity)
      `, [storePurchaseId, productId, productName, purchaseQuantity]);
    }

    // 获取完整的进货记录信息
    const [storePurchaseResult] = await query(`
      SELECT 
        sp.id,
        sp.document_id,
        sp.created_date,
        sp.store_id,
        s.name as store_name
      FROM store_purchases sp
      LEFT JOIN stores s ON sp.store_id = s.id
      WHERE sp.id = ?
    `, [storePurchaseId]);

    return NextResponse.json({ 
      success: true, 
      message: existingRecord.length > 0 ? '门店进货记录更新成功' : '门店进货记录创建成功',
      storePurchase: {
        id: storePurchaseResult.id,
        documentId: storePurchaseResult.document_id,
        createdDate: storePurchaseResult.created_date,
        storeId: storePurchaseResult.store_id,
        storeName: storePurchaseResult.store_name
      }
    });
  } catch (error) {
    console.error('保存门店进货记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '保存门店进货记录失败' 
    }, { status: 500 });
  }
}