// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY sort_order ASC, created_at DESC';

    const products = await query(sql, params);

    return NextResponse.json({ 
      success: true, 
      products: products.map((product: any) => ({
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
      })) 
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取商品列表失败' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      INSERT INTO products (name, code, category, specification, unit, sort_order, offline_sale) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, code || null, category, specification || null, unit || null, sortOrder || 0, body.offlineSale !== undefined ? body.offlineSale : 1]);

    const newProduct = await query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return NextResponse.json({ 
      success: true, 
      message: '商品创建成功',
      product: {
        id: newProduct[0].id,
        name: newProduct[0].name,
        code: newProduct[0].code,
        category: newProduct[0].category,
        specification: newProduct[0].specification,
        unit: newProduct[0].unit,
        sortOrder: newProduct[0].sort_order,
        offlineSale: newProduct[0].offline_sale !== undefined ? newProduct[0].offline_sale : 1,
        createdAt: newProduct[0].created_at,
        updatedAt: newProduct[0].updated_at
      }
    });
  } catch (error) {
    console.error('创建商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '创建商品失败' 
    }, { status: 500 });
  }
}