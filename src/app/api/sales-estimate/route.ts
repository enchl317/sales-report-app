import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, message: '缺少起始日期或结束日期参数' }, { status: 400 });
    }

    const stores: any[] = await query(
      'SELECT id, name, short_name, store_type FROM stores ORDER BY id ASC'
    ) as any[];

    const products: any[] = await query(
      'SELECT id, name, specification, unit FROM products ORDER BY sort_order ASC, id ASC'
    ) as any[];

    const resultData: { [key: number]: { [key: number]: number } } = {};

    for (const store of stores) {
      const startCountMap: { [key: number]: number } = {};
      const endCountMap: { [key: number]: number } = {};
      const purchaseMap: { [key: number]: number } = {};
      const transferInMap: { [key: number]: number } = {};
      const transferOutMap: { [key: number]: number } = {};

      const startCount: any[] = await query(
        `SELECT ic.id, DATE_FORMAT(ic.created_date, '%Y-%m-%d') as created_date 
         FROM inventory_counts ic 
         WHERE ic.store_id = ? AND ic.created_date <= ? 
         ORDER BY ic.created_date DESC, ic.id DESC 
         LIMIT 1`,
        [store.id, startDate]
      ) as any[];

      let startCountDate: string | null = null;
      if (startCount.length > 0) {
        startCountDate = startCount[0].created_date;
        const startCountDetails: any[] = await query(
          `SELECT product_id, counted_quantity 
           FROM inventory_count_details 
           WHERE inventory_count_id = ?`,
          [startCount[0].id]
        ) as any[];
        startCountDetails.forEach((d: any) => {
          startCountMap[d.product_id] = Number(d.counted_quantity);
        });
      }

      const endCount: any[] = await query(
        `SELECT ic.id, DATE_FORMAT(ic.created_date, '%Y-%m-%d') as created_date 
         FROM inventory_counts ic 
         WHERE ic.store_id = ? AND ic.created_date <= ? 
         ORDER BY ic.created_date DESC, ic.id DESC 
         LIMIT 1`,
        [store.id, endDate]
      ) as any[];

      let endCountDate: string | null = null;
      if (endCount.length > 0) {
        endCountDate = endCount[0].created_date;
        const endCountDetails: any[] = await query(
          `SELECT product_id, counted_quantity 
           FROM inventory_count_details 
           WHERE inventory_count_id = ?`,
          [endCount[0].id]
        ) as any[];
        endCountDetails.forEach((d: any) => {
          endCountMap[d.product_id] = Number(d.counted_quantity);
        });
      }

      if (startCountDate && endCountDate) {
        const purchaseDetails: any[] = await query(
          `SELECT spd.product_id, spd.purchase_quantity
           FROM store_purchase_details spd
           JOIN store_purchases sp ON spd.store_purchase_id = sp.id
           WHERE sp.store_id = ? AND sp.created_date > ? AND sp.created_date <= ?`,
          [store.id, startCountDate, endCountDate]
        ) as any[];
        purchaseDetails.forEach((d: any) => {
          purchaseMap[d.product_id] = (purchaseMap[d.product_id] || 0) + Number(d.purchase_quantity);
        });

        const transferInDetails: any[] = await query(
          `SELECT std.product_id, std.transfer_quantity
           FROM store_transfer_details std
           JOIN store_transfers st ON std.transfer_id = st.id
           WHERE st.target_store_id = ? AND st.created_date > ? AND st.created_date <= ?`,
          [store.id, startCountDate, endCountDate]
        ) as any[];
        transferInDetails.forEach((d: any) => {
          transferInMap[d.product_id] = (transferInMap[d.product_id] || 0) + Number(d.transfer_quantity);
        });

        const transferOutDetails: any[] = await query(
          `SELECT std.product_id, std.transfer_quantity
           FROM store_transfer_details std
           JOIN store_transfers st ON std.transfer_id = st.id
           WHERE st.source_store_id = ? AND st.created_date > ? AND st.created_date <= ?`,
          [store.id, startCountDate, endCountDate]
        ) as any[];
        transferOutDetails.forEach((d: any) => {
          transferOutMap[d.product_id] = (transferOutMap[d.product_id] || 0) + Number(d.transfer_quantity);
        });
      }

      const salesEstimate: { [key: number]: number } = {};
      products.forEach((p: any) => {
        const startInventory = startCountMap[p.id] || 0;
        const endInventory = endCountMap[p.id] || 0;
        const purchase = purchaseMap[p.id] || 0;
        const transferIn = transferInMap[p.id] || 0;
        const transferOut = transferOutMap[p.id] || 0;
        salesEstimate[p.id] = startInventory + purchase + transferIn - transferOut - endInventory;
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