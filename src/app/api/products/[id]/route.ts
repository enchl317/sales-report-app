// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        message: '无效的商品ID' 
      }, { status: 400 });
    }

    const products = await query('SELECT * FROM products WHERE id = ?', [id]);

    if (products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '商品不存在' 
      }, { status: 404 });
    }

    const product = products[0];

    return NextResponse.json({ 
      success: true, 
      product: {
        id: product.id,
        name: product.name,
        code: product.code,
        category: product.category,
        specification: product.specification,
        unit: product.unit,
          sortOrder: product.sort_order,
        offlineSale: product.offline_sale !== undefined ? product.offline_sale : 1,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取商品详情失败' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        message: '无效的商品ID' 
      }, { status: 400 });
    }

    const { name, code, category, specification, unit, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        message: '商品名称不能为空' 
      }, { status: 400 });
    }

    if (!['半成品', '熟制品', '肉干与其它', '耗材', '话梅'].includes(category)) {
      return NextResponse.json({ 
        success: false, 
        message: '无效的商品品类' 
      }, { status: 400 });
    }

    const result: any = await query(`
      UPDATE products 
      SET name = ?, code = ?, category = ?, specification = ?, unit = ?, sort_order = ?, offline_sale = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, code || null, category, specification || null, unit || null, sortOrder || 0, body.offlineSale !== undefined ? body.offlineSale : 1, id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '商品不存在' 
      }, { status: 404 });
    }

    const updatedProduct = await query('SELECT * FROM products WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: '商品更新成功',
      product: {
        id: updatedProduct[0].id,
        name: updatedProduct[0].name,
        code: updatedProduct[0].code,
        category: updatedProduct[0].category,
        specification: updatedProduct[0].specification,
        unit: updatedProduct[0].unit,
        sortOrder: updatedProduct[0].sort_order,
        offlineSale: updatedProduct[0].offline_sale !== undefined ? updatedProduct[0].offline_sale : 1,
        createdAt: updatedProduct[0].created_at,
        updatedAt: updatedProduct[0].updated_at
      }
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '更新商品失败' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        message: '无效的商品ID' 
      }, { status: 400 });
    }

    const result: any = await query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '商品不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '商品删除成功'
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '删除商品失败' 
    }, { status: 500 });
  }
}