// src/app/api/inventory-count/route.ts
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
        ic.id,
        ic.document_id,
        ic.created_date,
        ic.store_id,
        s.name as store_name,
        ic.created_at,
        ic.updated_at
      FROM inventory_counts ic
      LEFT JOIN stores s ON ic.store_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (storeId) {
      sql += ' AND ic.store_id = ?';
      params.push(parseInt(storeId));
    }

    if (date) {
      sql += ' AND ic.created_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY ic.created_date DESC, ic.created_at DESC';

    const inventoryCounts = await query(sql, params);

    return NextResponse.json({ 
      success: true, 
      inventoryCounts: inventoryCounts.map((ic: any) => ({
        id: ic.id,
        documentId: ic.document_id,
        createdDate: ic.created_date,
        storeId: ic.store_id,
        storeName: ic.store_name,
        createdAt: ic.created_at,
        updatedAt: ic.updated_at
      })) 
    });
  } catch (error) {
    console.error('获取库存盘点记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取库存盘点记录失败' 
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

    // 检查当天是否已有盘点记录
    const existingRecord = await query(`
      SELECT id FROM inventory_counts 
      WHERE store_id = ? AND created_date = ?
    `, [storeId, createdDate]);

    let inventoryCountId: number;

    if (existingRecord.length > 0) {
      // 如果已存在，则更新记录
      inventoryCountId = existingRecord[0].id;
      
      // 删除现有的明细记录
      await query('DELETE FROM inventory_count_details WHERE inventory_count_id = ?', [inventoryCountId]);
    } else {
      // 生成单据ID (KCPD+门店id+日期)，门店ID补足两位数
      const paddedStoreId = String(storeId).padStart(2, '0');
      const documentId = `KCPD${paddedStoreId}${createdDate.replace(/-/g, '')}`;
      
      // 创建新的盘点主记录
      const result: any = await query(`
        INSERT INTO inventory_counts (document_id, created_date, store_id)
        VALUES (?, ?, ?)
      `, [documentId, createdDate, storeId]);
      
      inventoryCountId = result.insertId;
    }

    // 插入或更新明细记录
    for (const detail of details) {
      const { productId, productName, countedQuantity } = detail;
      
      if (countedQuantity < 0) {
        return NextResponse.json({ 
          success: false, 
          message: `商品 ${productName} 的盘点数量不能为负数` 
        }, { status: 400 });
      }

      await query(`
        INSERT INTO inventory_count_details (inventory_count_id, product_id, product_name, counted_quantity)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        product_name = VALUES(product_name),
        counted_quantity = VALUES(counted_quantity)
      `, [inventoryCountId, productId, productName, countedQuantity]);
    }

    // 获取完整的盘点记录信息
    const [inventoryCountResult] = await query(`
      SELECT 
        ic.id,
        ic.document_id,
        ic.created_date,
        ic.store_id,
        s.name as store_name
      FROM inventory_counts ic
      LEFT JOIN stores s ON ic.store_id = s.id
      WHERE ic.id = ?
    `, [inventoryCountId]);

    return NextResponse.json({ 
      success: true, 
      message: existingRecord.length > 0 ? '库存盘点记录更新成功' : '库存盘点记录创建成功',
      inventoryCount: {
        id: inventoryCountResult.id,
        documentId: inventoryCountResult.document_id,
        createdDate: inventoryCountResult.created_date,
        storeId: inventoryCountResult.store_id,
        storeName: inventoryCountResult.store_name
      }
    });
  } catch (error) {
    console.error('保存库存盘点记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '保存库存盘点记录失败' 
    }, { status: 500 });
  }
}