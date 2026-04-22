// src/app/api/inventory-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import * as XLSX from 'xlsx';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

    // 如果action=export，则导出Excel
  if (action === 'export') {
    const response = await handleExport();
    // 添加缓存控制头部
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // 默认返回JSON数据
  const response = await handleGetData();
  
  // 添加缓存控制头部，确保不缓存
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

async function handleGetData() {
  try {
    // 1. 获取所有商品（SKU）
    const products = await query(`
      SELECT id, name, specification, unit 
      FROM products 
      ORDER BY sort_order ASC, id ASC
    `);

    // 2. 获取所有门店
    const stores = await query(`
      SELECT id, name, short_name 
      FROM stores 
      ORDER BY id ASC
    `);

    // 3. 获取每个门店的最新盘点记录
    // 首先获取每个门店的最新盘点日期
    const latestCounts = await query(`
      SELECT ic1.store_id, ic1.created_date, ic1.id as inventory_count_id
      FROM inventory_counts ic1
      WHERE ic1.id = (
        SELECT ic2.id
        FROM inventory_counts ic2
        WHERE ic2.store_id = ic1.store_id
        ORDER BY ic2.created_date DESC, ic2.id DESC
        LIMIT 1
      )
    `);

    // 4. 构建门店ID到最新盘点信息的映射
    const storeLatestMap = new Map();
    for (const item of latestCounts as any[]) {
      // 处理日期，可能是字符串或Date对象
      let dateStr: string | null = null;
      if (item.created_date) {
        if (typeof item.created_date === 'string') {
          // 处理字符串格式 "2026-04-21" 或 "2026-04-21T00:00:00.000Z"
          dateStr = item.created_date.split(' ')[0].split('T')[0];
        } else if (item.created_date instanceof Date) {
          // 处理Date对象，使用toISOString获取UTC日期字符串
          // 然后提取日期部分，避免时区转换问题
          const isoStr = item.created_date.toISOString();
          dateStr = isoStr.split('T')[0];
        }
      }
      storeLatestMap.set(item.store_id, {
        date: dateStr,
        inventoryCountId: item.inventory_count_id
      });
    }

    // 5. 获取所有最新盘点的明细数据
    const latestCountIds = (latestCounts as any[]).map((item: any) => item.inventory_count_id);
    let inventoryDetails: any[] = [];
    
    if (latestCountIds.length > 0) {
      const placeholders = latestCountIds.map(() => '?').join(',');
      inventoryDetails = await query(`
        SELECT inventory_count_id, product_id, counted_quantity
        FROM inventory_count_details
        WHERE inventory_count_id IN (${placeholders})
      `, latestCountIds);
    }

    // 6. 构建 product_id + inventory_count_id 到数量的映射
    const detailMap = new Map();
    for (const detail of inventoryDetails as any[]) {
      const key = `${detail.inventory_count_id}_${detail.product_id}`;
      detailMap.set(key, detail.counted_quantity);
    }

    // 7. 构建返回数据
    // 构建表头：门店列表
    const storeHeaders = (stores as any[]).map(store => ({
      id: store.id,
      name: store.name,
      shortName: store.short_name,
      latestDate: storeLatestMap.get(store.id)?.date || null
    }));

    // 构建表格行数据：每个商品一行
    const tableRows = (products as any[]).map(product => {
      const row: any = {
        productId: product.id,
        productName: product.name,
        specification: product.specification,
        unit: product.unit,
        storeData: {}
      };

      // 为每个门店填充库存数据
      for (const store of stores as any[]) {
        const latestInfo = storeLatestMap.get(store.id);
        if (latestInfo) {
          const key = `${latestInfo.inventoryCountId}_${product.id}`;
          row.storeData[store.id] = detailMap.get(key) ?? null;
        } else {
          row.storeData[store.id] = null;
        }
      }

      return row;
    });

    return NextResponse.json({
      success: true,
      storeHeaders,
      tableRows
    });
  } catch (error) {
    console.error('获取库存汇总数据失败:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '获取库存汇总数据失败'
    }, { status: 500 });
  }
}

async function handleExport() {
  try {
    // 1. 获取所有商品（SKU）
    const products = await query(`
      SELECT id, name, specification, unit 
      FROM products 
      ORDER BY sort_order ASC, id ASC
    `);

    // 2. 获取所有门店
    const stores = await query(`
      SELECT id, name, short_name 
      FROM stores 
      ORDER BY id ASC
    `);

    // 3. 获取每个门店的最新盘点记录
    const latestCounts = await query(`
      SELECT ic1.store_id, ic1.created_date, ic1.id as inventory_count_id
      FROM inventory_counts ic1
      WHERE ic1.id = (
        SELECT ic2.id
        FROM inventory_counts ic2
        WHERE ic2.store_id = ic1.store_id
        ORDER BY ic2.created_date DESC, ic2.id DESC
        LIMIT 1
      )
    `);

    // 4. 构建门店ID到最新盘点信息的映射
    const storeLatestMap = new Map();
    for (const item of latestCounts as any[]) {
      // 处理日期，可能是字符串或Date对象
      let dateStr: string | null = null;
      if (item.created_date) {
        if (typeof item.created_date === 'string') {
          // 处理字符串格式 "2026-04-21" 或 "2026-04-21T00:00:00.000Z"
          dateStr = item.created_date.split(' ')[0].split('T')[0];
        } else if (item.created_date instanceof Date) {
          // 处理Date对象，使用toISOString获取UTC日期字符串
          // 然后提取日期部分，避免时区转换问题
          const isoStr = item.created_date.toISOString();
          dateStr = isoStr.split('T')[0];
        }
      }
      storeLatestMap.set(item.store_id, {
        date: dateStr,
        inventoryCountId: item.inventory_count_id
      });
    }

    // 5. 获取所有最新盘点的明细数据
    const latestCountIds = (latestCounts as any[]).map((item: any) => item.inventory_count_id);
    let inventoryDetails: any[] = [];
    
    if (latestCountIds.length > 0) {
      const placeholders = latestCountIds.map(() => '?').join(',');
      inventoryDetails = await query(`
        SELECT inventory_count_id, product_id, counted_quantity
        FROM inventory_count_details
        WHERE inventory_count_id IN (${placeholders})
      `, latestCountIds);
    }

    // 6. 构建 product_id + inventory_count_id 到数量的映射
    const detailMap = new Map();
    for (const detail of inventoryDetails as any[]) {
      const key = `${detail.inventory_count_id}_${detail.product_id}`;
      detailMap.set(key, detail.counted_quantity);
    }

    // 7. 构建Excel数据
    // 表头行
    const headerRow = ['商品', '规格', '单位'];
    for (const store of stores as any[]) {
      const latestInfo = storeLatestMap.get(store.id);
      const dateStr = latestInfo ? latestInfo.date : '未盘点';
      headerRow.push(`${store.name}(${dateStr})`);
    }

    const excelData = [headerRow];

    // 数据行
    for (const product of products as any[]) {
      const row = [
        product.name,
        product.specification || '',
        product.unit || ''
      ];

      for (const store of stores as any[]) {
        const latestInfo = storeLatestMap.get(store.id);
        if (latestInfo) {
          const key = `${latestInfo.inventoryCountId}_${product.id}`;
          const value = detailMap.get(key);
          row.push(value !== undefined ? value : '');
        } else {
          row.push('');
        }
      }

      excelData.push(row);
    }

    // 生成Excel
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '库存汇总');

    // 设置列宽
    const colWidths = [
      { wch: 20 }, // 商品名称
      { wch: 12 }, // 规格
      { wch: 8 },  // 单位
      ...Array(stores.length).fill({ wch: 15 }) // 每个门店列
    ];
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 返回Excel文件
    const filename = `inventory_summary_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      }
    });
  } catch (error) {
    console.error('导出库存汇总Excel失败:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '导出库存汇总Excel失败'
    }, { status: 500 });
  }
}