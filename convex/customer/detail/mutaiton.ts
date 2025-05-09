import { mutation } from '@/convex/_generated/server';
import { v } from 'convex/values';
import { excludeFields, archiveRecord, killRecord } from '@/services/convex/shared/utils/helper';
import { genderType } from '@/services/convex/shared/types/common';
import {
  validateCustomerDetail,
  validateRequired,
} from '@/services/convex/shared/utils/validation';
import { checkAuth } from '@/services/convex/shared/utils/auth';
import { updateType } from '@/services/convex/shared/types/common';
import { throwConvexError } from '@/lib/error';

// 顧客詳細情報の追加
export const create = mutation({
  args: {
    customerId: v.id('customer'),
    email: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(genderType),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateCustomerDetail(args);
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.isArchive) {
      throw throwConvexError({
        message: '指定された顧客が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定された顧客が存在しません',
        callFunc: 'customer.detail.create',
        severity: 'low',
        details: { ...args },
      });
    }

    // 既存の詳細データがないか確認
    const existingDetail = await ctx.db
      .query('customer_detail')
      .withIndex('by_customer_id', (q) =>
        q.eq('customerId', args.customerId).eq('isArchive', false)
      )
      .first();

    if (existingDetail) {
      throw throwConvexError({
        message: '指定された顧客詳細情報が存在します',
        status: 400,
        code: 'DUPLICATE_RECORD',
        title: '指定された顧客詳細情報が存在します',
        callFunc: 'customer.detail.create',
        severity: 'low',
        details: { ...args },
      });
    }
    const detailId = await ctx.db.insert('customer_detail', {
      ...args,
      isArchive: false,
    });
    return detailId;
  },
});

// 顧客詳細情報の更新
export const update = mutation({
  args: {
    detailId: v.id('customer_detail'),
    email: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(genderType),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateCustomerDetail(args);
    const detail = await ctx.db.get(args.detailId);
    if (!detail || detail.isArchive) {
      throw throwConvexError({
        message: '指定された顧客詳細情報が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定された顧客詳細情報が存在しません',
        callFunc: 'customer.detail.update',
        severity: 'low',
        details: { ...args },
      });
    }

    // 顧客情報の取得
    const customer = await ctx.db.get(detail.customerId);
    if (!customer || customer.isArchive) {
      throw throwConvexError({
        message: '関連する顧客が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '関連する顧客が存在しません',
        callFunc: 'customer.detail.update',
        severity: 'low',
        details: { ...args },
      });
    }

    const updateData = excludeFields(args, ['detailId']);
    const newDetailId = await ctx.db.patch(args.detailId, updateData);
    return newDetailId;
  },
});

// 顧客詳細情報の作成または更新
export const upsert = mutation({
  args: {
    customerId: v.id('customer'),
    email: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(genderType),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateCustomerDetail(args);
    const customer = await ctx.db.get(args.customerId);
    if (!customer || customer.isArchive) {
      throw throwConvexError({
        message: '指定された顧客が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定された顧客が存在しません',
        callFunc: 'customer.detail.upsert',
        severity: 'low',
        details: { ...args },
      });
    }

    // 既存の詳細データがないか確認
    const existingDetail = await ctx.db
      .query('customer_detail')
      .withIndex('by_customer_id', (q) =>
        q.eq('customerId', args.customerId).eq('isArchive', false)
      )
      .first();

    if (existingDetail) {
      // 更新
      const updateData = excludeFields(args, ['customerId']);
      return await ctx.db.patch(existingDetail._id, updateData);
    } else {
      // 新規作成
      return await ctx.db.insert('customer_detail', {
        ...args,
        isArchive: false,
      });
    }
  },
});

// 顧客詳細情報の削除
export const archive = mutation({
  args: {
    detailId: v.id('customer_detail'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.detailId, 'detailId');
    return await archiveRecord(ctx, args.detailId);
  },
});

export const kill = mutation({
  args: {
    detailId: v.id('customer_detail'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.detailId, 'detailId');
    return await killRecord(ctx, args.detailId);
  },
});

// 利用回数の更新
export const updateUseCount = mutation({
  args: {
    customerId: v.id('customer'),
    type: updateType,
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.customerId, 'customerId');
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw throwConvexError({
        message: '指定された顧客が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定された顧客が存在しません',
        callFunc: 'customer.detail.updateUseCount',
        severity: 'low',
        details: { ...args },
      });
    }

    if (args.type === 'increment') {
      return await ctx.db.patch(args.customerId, {
        useCount: customer.useCount ? customer.useCount + 1 : 1,
      });
    } else {
      return await ctx.db.patch(args.customerId, {
        useCount: customer.useCount ? customer.useCount - 1 : 0,
      });
    }
  },
});
