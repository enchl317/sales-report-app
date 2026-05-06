import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 计算某门店某日期的库存（复用store-inventory的逻辑）
async function calculateInventory(storeId: number, targetDate: string): Promise<{ [key: number]: number }> {
  // 1. 查找该门店在目标日期之前最新的一次盘点单
  const latestCount: any[] = await query(
    `SELECT ic.id, DATE_FORMAT(ic.created_date, '%Y-%m-%d') as created_date 
     FROM inventory_counts ic 
     WHERE ic.store_id = ? AND ic.created_date <= ? 
     ORDER BY ic.created_date DESC, ic.id DESC 
     LIMIT 1`,
    [storeId, targetDate]
  ) as any[];

  const countId = latestCount.length > 0 ? latestCount[0].id : null;
  const countDate = latestCount.length > 0 ? latestCount[0].created_date : null;

  // 2. 获取该盘点单的商品库存数据
  let countDetails: any[] = [];
  if (countId) {
    countDetails = await query(
      `SELECT product_id, counted_quantity 
       FROM inventory_count_details 
       WHERE inventory_count_id = ?`,
      [countId]
    ) as any[];
  }

  const countMap: { [key: number]: number } = {};
  countDetails.forEach((d: any) => {
    countMap[d.product_id] = Number(d.counted_quantity);
  });

  // 3. 查找盘点日期之后到目标日期之间的进货
  let purchaseDetails: any[] = [];
  if (countDate) {
    purchaseDetails = await query(
      `SELECT spd.product_id, spd.purchase_quantity
       FROM store_purchase_details spd
       JOIN store_purchases sp ON spd.store_purchase_id = sp.id
       WHERE sp.store_id = ? AND sp.created_date > ? AND sp.created_date <= ?`,
      [storeId, countDate, targetDate]
    ) as any[];
  } else {
    purchaseDetails = await query(
      `SELECT spd.product_id, spd.purchase_quantity
       FROM store_purchase_details spd
       JOIN store_purchases sp ON spd.store_purchase_id = sp.id
       WHERE sp.store_id = ? AND sp.created_date <= ?`,
      [storeId, targetDate]
    ) as any[];
  }

  const purchaseMap: { [key: number]: number } = {};
  purchaseDetails.forEach((d: any) => {
    purchaseMap[d.product_id] = (purchaseMap[d.product_id] || 0) + Number(d.purchase_quantity);
  });

  // 4. 调拨入
  let transferInDetails: any[] = [];
  if (countDate) {
    transferInDetails = await query(
      `SELECT std.product_id, std.transfer_quantity
       FROM store_transfer_details std
       JOIN store_transfers st ON std.transfer_id = st.id
       WHERE st.target_store_id = ? AND st.created_date > ? AND st.created_date <= ?`,
      [storeId, countDate, targetDate]
    ) as any[];
  } else {
    transferInDetails = await query(
      `SELECT std.product_id, std.transfer_quantity
       FROM store_transfer_details std
       JOIN store_transfers st ON std.transfer_id = st.id
       WHERE st.target_store_id = ? AND st.created_date <= ?`,
      [storeId, targetDate]
    ) as any[];
  }

  const transferInMap: { [key: number]: number } = {};
  transferInDetails.forEach((d: any) => {
    transferInMap[d.product_id] = (transferInMap[d.product_id] || 0) + Number(d.transfer_quantity);
  });

  // 5. 调拨出
  let transferOutDetails: any[] = [];
  if (countDate) {
    transferOutDetails = await query(
      `SELECT std.product_id, std.transfer_quantity
       FROM store_transfer_details std
       JOIN store_transfers st ON std.transfer_id = st.id
       WHERE st.source_store_id = ? AND st.created_date > ? AND st.created_date <= ?`,
      [storeId, countDate, targetDate]
    ) as any[];
  } else {
    transferOutDetails = await query(
      `SELECT std.product_id, std.transfer_quantity
       FROM store_transfer_details std
       JOIN store_transfers st ON std.transfer_id = st.id
       WHERE st.source_store_id = ? AND st.created_date <= ?`,
      [storeId, targetDate]
    ) as any[];
  }

  const transferOutMap: { [key: number]: number } = {};
  transferOutDetails.forEach((d: any) => {
    transferOutMap[d.product_id] = (transferOutMap[d.product_id] || 0) + Number(d.transfer_quantity);
  });

  // 6. 计算每个商品的当前库存 = 盘点 + 进货 + 调拨入 - 调拨出
  const inventoryMap: { [key: number]: number } = {};
  // 获取所有商品ID
  const products: any[] = await query(
    'SELECT id FROM products ORDER BY sort_order ASC, id ASC'
  ) as any[];

  products.forEach((p: any) => {
    const base = countMap[p.id] || 0;
    const purchase = purchaseMap[p.id] || 0;
    const transferIn = transferInMap[p.id] || 0;
    const transferOut = transferOutMap[p.id] || 0;
    inventoryMap[p.id] = base + purchase + transferIn - transferOut;
  });

  return inventoryMap;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, message: '缺少起始日期或结束日期参数' }, { status: 400 });
    }

    // 1. 获取所有门店
    const stores: any[] = await query(
      'SELECT id, name, short_name, store_type FROM stores ORDER BY id ASC'
    ) as any[];

    // 2. 获取所有商品
    const products: any[] = await query(
      'SELECT id, name, specification, unit FROM products ORDER BY sort_order ASC, id ASC'
    ) as any[];

    // 3. 对每个门店计算起始日期和结束日期的库存
    const resultData: { [key: number]: { [key: number]: number } } = {};

    for (const store of stores) {
      const startInventory = await calculateInventory(store.id, startDate);
      const endInventory = await calculateInventory(store.id, endDate);

      // 销售预估 = 结束日期库存 - 起始日期库存
      const salesEstimate: { [key: number]: number } = {};
      products.forEach((p: any) => {
        salesEstimate[p.id] = endInventory[p.id] - startInventory[p.id];
      });

      resultData[store.id] = salesEstimate;
    }

    const response = NextResponse.json({
      success: true,
      data: {
        stores: stores.map((s: any) => ({
          id: s.id,
          name: s.name,
          short_name: s.short_name,
          storeType: s.store_type
        })),
        products: products.map((p: any) => ({
          id: p.id,
          name: p.name,
          specification: p.specification || '',
          unit: p.unit || ''
        })),
        salesEstimates: resultData
      }
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error) {
    console.error('获取销售预估数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取销售预估数据失败' 
    }, { status: 500 });
  }
}