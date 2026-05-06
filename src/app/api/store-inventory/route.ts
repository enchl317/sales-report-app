import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const targetDate = searchParams.get('targetDate');

    if (!storeId || !targetDate) {
      return NextResponse.json({ success: false, message: '缺少门店ID或日期参数' }, { status: 400 });
    }

    // 1. 获取所有商品列表
    const products: any[] = await query(
      'SELECT id, name, specification, unit FROM products ORDER BY sort_order ASC, id ASC'
    ) as any[];

    // 2. 查找该门店在目标日期之前最新的一次盘点单
    const latestCount: any[] = await query(
      `SELECT ic.id, ic.document_id, DATE_FORMAT(ic.created_date, '%Y-%m-%d') as created_date 
       FROM inventory_counts ic 
       WHERE ic.store_id = ? AND ic.created_date <= ? 
       ORDER BY ic.created_date DESC, ic.id DESC 
       LIMIT 1`,
      [storeId, targetDate]
    ) as any[];

    const countId = latestCount.length > 0 ? latestCount[0].id : null;
    const countDate = latestCount.length > 0 ? latestCount[0].created_date : null;
    const countDocumentId = latestCount.length > 0 ? latestCount[0].document_id : null;

    // 3. 获取该盘点单的商品库存数据
    let countDetails: any[] = [];
    if (countId) {
      countDetails = await query(
        `SELECT product_id, counted_quantity 
         FROM inventory_count_details 
         WHERE inventory_count_id = ?`,
        [countId]
      ) as any[];
    }

    // 构建盘点库存映射: productId -> counted_quantity
    const countMap: { [key: number]: number } = {};
    countDetails.forEach((d: any) => {
      countMap[d.product_id] = Number(d.counted_quantity);
    });

    // 4. 查找盘点日期之后到目标日期之间的所有进货单
    let purchaseDetails: any[] = [];
    if (countDate) {
      purchaseDetails = await query(
        `SELECT spd.product_id, spd.purchase_quantity, sp.document_id, DATE_FORMAT(sp.created_date, '%Y-%m-%d') as created_date
         FROM store_purchase_details spd
         JOIN store_purchases sp ON spd.store_purchase_id = sp.id
         WHERE sp.store_id = ? AND sp.created_date > ? AND sp.created_date <= ?
         ORDER BY sp.created_date, sp.id`,
        [storeId, countDate, targetDate]
      ) as any[];
    } else {
      // 没有盘点记录时，查询目标日期之前的所有进货
      purchaseDetails = await query(
        `SELECT spd.product_id, spd.purchase_quantity, sp.document_id, DATE_FORMAT(sp.created_date, '%Y-%m-%d') as created_date
         FROM store_purchase_details spd
         JOIN store_purchases sp ON spd.store_purchase_id = sp.id
         WHERE sp.store_id = ? AND sp.created_date <= ?
         ORDER BY sp.created_date, sp.id`,
        [storeId, targetDate]
      ) as any[];
    }

    // 构建进货变化列表: productId -> [{quantity, documentId, date, type}]
    const purchaseChanges: { [key: number]: Array<{quantity: number, documentId: string, date: string, type: string}> } = {};
    purchaseDetails.forEach((d: any) => {
      if (!purchaseChanges[d.product_id]) purchaseChanges[d.product_id] = [];
      purchaseChanges[d.product_id].push({
        quantity: Number(d.purchase_quantity),
        documentId: d.document_id,
        date: d.created_date,
        type: '进货'
      });
    });

    // 5. 查找调拨进该门店的记录（target_store_id = storeId）
    let transferInDetails: any[] = [];
    if (countDate) {
      transferInDetails = await query(
        `SELECT std.product_id, std.transfer_quantity, st.document_id, DATE_FORMAT(st.created_date, '%Y-%m-%d') as created_date, st.source_store_name
         FROM store_transfer_details std
         JOIN store_transfers st ON std.transfer_id = st.id
         WHERE st.target_store_id = ? AND st.created_date > ? AND st.created_date <= ?
         ORDER BY st.created_date, st.id`,
        [storeId, countDate, targetDate]
      ) as any[];
    } else {
      transferInDetails = await query(
        `SELECT std.product_id, std.transfer_quantity, st.document_id, DATE_FORMAT(st.created_date, '%Y-%m-%d') as created_date, st.source_store_name
         FROM store_transfer_details std
         JOIN store_transfers st ON std.transfer_id = st.id
         WHERE st.target_store_id = ? AND st.created_date <= ?
         ORDER BY st.created_date, st.id`,
        [storeId, targetDate]
      ) as any[];
    }

    const transferInChanges: { [key: number]: Array<{quantity: number, documentId: string, date: string, type: string, detail: string}> } = {};
    transferInDetails.forEach((d: any) => {
      if (!transferInChanges[d.product_id]) transferInChanges[d.product_id] = [];
      transferInChanges[d.product_id].push({
        quantity: Number(d.transfer_quantity),
        documentId: d.document_id,
        date: d.created_date,
        type: '调拨入',
        detail: `从${d.source_store_name || '门店'}调入`
      });
    });

    // 6. 查找从该门店调拨出的记录（source_store_id = storeId）
    let transferOutDetails: any[] = [];
    if (countDate) {
      transferOutDetails = await query(
        `SELECT std.product_id, std.transfer_quantity, st.document_id, DATE_FORMAT(st.created_date, '%Y-%m-%d') as created_date, st.target_store_name
         FROM store_transfer_details std
         JOIN store_transfers st ON std.transfer_id = st.id
         WHERE st.source_store_id = ? AND st.created_date > ? AND st.created_date <= ?
         ORDER BY st.created_date, st.id`,
        [storeId, countDate, targetDate]
      ) as any[];
    } else {
      transferOutDetails = await query(
        `SELECT std.product_id, std.transfer_quantity, st.document_id, DATE_FORMAT(st.created_date, '%Y-%m-%d') as created_date, st.target_store_name
         FROM store_transfer_details std
         JOIN store_transfers st ON std.transfer_id = st.id
         WHERE st.source_store_id = ? AND st.created_date <= ?
         ORDER BY st.created_date, st.id`,
        [storeId, targetDate]
      ) as any[];
    }

    const transferOutChanges: { [key: number]: Array<{quantity: number, documentId: string, date: string, type: string, detail: string}> } = {};
    transferOutDetails.forEach((d: any) => {
      if (!transferOutChanges[d.product_id]) transferOutChanges[d.product_id] = [];
      transferOutChanges[d.product_id].push({
        quantity: -Number(d.transfer_quantity),
        documentId: d.document_id,
        date: d.created_date,
        type: '调拨出',
        detail: `调至${d.target_store_name || '门店'}`
      });
    });

    // 7. 组装每个商品的数据
    const inventoryData = products.map((product: any) => {
      const baseCount = countMap[product.id] || 0;
      const purchases = purchaseChanges[product.id] || [];
      const transferIns = transferInChanges[product.id] || [];
      const transferOuts = transferOutChanges[product.id] || [];

      const purchaseTotal = purchases.reduce((sum: number, p: any) => sum + p.quantity, 0);
      const transferInTotal = transferIns.reduce((sum: number, p: any) => sum + p.quantity, 0);
      const transferOutTotal = transferOuts.reduce((sum: number, p: any) => sum + Math.abs(p.quantity), 0);

      const currentInventory = baseCount + purchaseTotal + transferInTotal - transferOutTotal;

      // 合并所有变化记录，按日期排序
      const allChanges = [
        ...purchases,
        ...transferIns,
        ...transferOuts
      ].sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
      });

      return {
        productId: product.id,
        productName: product.name,
        specification: product.specification || '',
        unit: product.unit || '',
        baseCount: baseCount,
        purchaseTotal: purchaseTotal,
        transferInTotal: transferInTotal,
        transferOutTotal: transferOutTotal,
        currentInventory: currentInventory,
        changes: allChanges,
        hasInventory: countId !== null || purchases.length > 0 || transferIns.length > 0 || transferOuts.length > 0
      };
    });

    const response = NextResponse.json({
      success: true,
      data: {
        countDocumentId: countDocumentId,
        countDate: countDate,
        inventoryData: inventoryData
      }
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;

  } catch (error) {
    console.error('获取门店库存数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取门店库存数据失败' 
    }, { status: 500 });
  }
}