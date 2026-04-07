// src/app/api/inventory-count/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态处理错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    
    // 检查参数是否为数字（表示ID）还是文档ID格式
    const isNumeric = /^\d+$/.test(idParam);
    
    let inventoryCountResult: any;
    let inventoryCountId: number;
    
    if (isNumeric) {
      // 如果是数字，按ID查询
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return NextResponse.json({ 
          success: false, 
          message: '无效的盘点记录ID' 
        }, { status: 400 });
      }

      inventoryCountResult = await query(`
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
        WHERE ic.id = ?
      `, [id]);
      
      if (inventoryCountResult.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: '盘点记录不存在' 
        }, { status: 404 });
      }
      
      inventoryCountResult = inventoryCountResult[0];
      inventoryCountId = id;
    } else {
      // 如果不是数字，按文档ID查询
      const documentId = decodeURIComponent(idParam);
      
      inventoryCountResult = await query(`
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
        WHERE ic.document_id = ?
      `, [documentId]);
      
      if (inventoryCountResult.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: '盘点记录不存在' 
        }, { status: 404 });
      }
      
      inventoryCountResult = inventoryCountResult[0];
      inventoryCountId = inventoryCountResult.id;
    }

    // 获取盘点明细记录
    const details = await query(`
      SELECT 
        d.id,
        d.product_id,
        d.product_name,
        d.counted_quantity,
        d.created_at,
        d.updated_at
      FROM inventory_count_details d
      WHERE d.inventory_count_id = ?
      ORDER BY d.product_id
    `, [inventoryCountId]);

    return NextResponse.json({ 
      success: true, 
      inventoryCount: {
        id: inventoryCountResult.id,
        documentId: inventoryCountResult.document_id,
        createdDate: inventoryCountResult.created_date,
        storeId: inventoryCountResult.store_id,
        storeName: inventoryCountResult.store_name,
        createdAt: inventoryCountResult.created_at,
        updatedAt: inventoryCountResult.updated_at
      },
      details: details.map((detail: any) => ({
        id: detail.id,
        productId: detail.product_id,
        productName: detail.product_name,
        countedQuantity: detail.counted_quantity,
        createdAt: detail.created_at,
        updatedAt: detail.updated_at
      }))
    });
  } catch (error) {
    console.error('获取库存盘点详情失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取库存盘点详情失败' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    
    // 检查参数是否为数字（表示ID）还是文档ID格式
    const isNumeric = /^\d+$/.test(idParam);
    let result: any;
    
    if (isNumeric) {
      // 如果是数字，按ID删除
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return NextResponse.json({ 
          success: false, 
          message: '无效的盘点记录ID' 
        }, { status: 400 });
      }

      result = await query('DELETE FROM inventory_counts WHERE id = ?', [id]);
    } else {
      // 如果不是数字，按文档ID删除
      const documentId = decodeURIComponent(idParam);
      result = await query('DELETE FROM inventory_counts WHERE document_id = ?', [documentId]);
    }

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '盘点记录不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '盘点记录删除成功'
    });
  } catch (error) {
    console.error('删除盘点记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '删除盘点记录失败' 
    }, { status: 500 });
  }
}