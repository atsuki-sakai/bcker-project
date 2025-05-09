import { mutation, query } from '@/convex/_generated/server';
import { v } from 'convex/values';
import { archiveRecord, killRecord, excludeFields } from '@/services/convex/shared/utils/helper';
import { paginationOptsValidator } from 'convex/server';
import {
  validateCouponTransaction,
  validateRequired,
} from '@/services/convex/shared/utils/validation';
import { checkAuth } from '@/services/convex/shared/utils/auth';
import { ConvexError } from 'convex/values';

// クーポン取引の追加
export const add = mutation({
  args: {
    couponId: v.id('coupon'),
    customerId: v.id('customer'),
    reservationId: v.id('reservation'),
    transactionDate_unix: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateCouponTransaction(args);
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new ConvexError({
        message: '指定されたクーポンが存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたクーポンが存在しません',
        details: { ...args },
      });
    }

    // 顧客の存在確認
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new ConvexError({
        message: '指定された顧客が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定された顧客が存在しません',
        details: { ...args },
      });
    }

    // 予約の存在確認
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new ConvexError({
        message: '指定された予約が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定された予約が存在しません',
        details: { ...args },
      });
    }

    const couponTransactionId = await ctx.db.insert('coupon_transaction', {
      ...args,
      isArchive: false,
    });
    return couponTransactionId;
  },
});

// クーポン取引の更新
export const update = mutation({
  args: {
    couponTransactionId: v.id('coupon_transaction'),
    transactionDate_unix: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateCouponTransaction(args);
    // クーポン取引の存在確認
    const couponTransaction = await ctx.db.get(args.couponTransactionId);
    if (!couponTransaction || couponTransaction.isArchive) {
      throw new ConvexError({
        message: '指定されたクーポン取引が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたクーポン取引が存在しません',
        details: { ...args },
      });
    }

    const updateData = excludeFields(args, ['couponTransactionId']);

    const newCouponTransactionId = await ctx.db.patch(args.couponTransactionId, updateData);
    return newCouponTransactionId;
  },
});

// クーポン取引の削除
export const archive = mutation({
  args: {
    couponTransactionId: v.id('coupon_transaction'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.couponTransactionId, 'couponTransactionId');
    return await archiveRecord(ctx, args.couponTransactionId);
  },
});

export const upsert = mutation({
  args: {
    couponTransactionId: v.id('coupon_transaction'),
    couponId: v.id('coupon'),
    customerId: v.id('customer'),
    reservationId: v.id('reservation'),
    transactionDate_unix: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateCouponTransaction(args);
    const existingCouponTransaction = await ctx.db.get(args.couponTransactionId);

    if (!existingCouponTransaction || existingCouponTransaction.isArchive) {
      const updateData = excludeFields(args, ['couponTransactionId']);
      return await ctx.db.insert('coupon_transaction', {
        ...updateData,
        couponId: args.couponId,
        customerId: args.customerId,
        reservationId: args.reservationId,
        isArchive: false,
      });
    } else {
      const updateData = excludeFields(args, ['couponTransactionId']);
      return await ctx.db.patch(existingCouponTransaction._id, updateData);
    }
  },
});

export const kill = mutation({
  args: {
    couponTransactionId: v.id('coupon_transaction'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.couponTransactionId, 'couponTransactionId');
    return await killRecord(ctx, args.couponTransactionId);
  },
});

// クーポンIDからクーポン取引履歴を取得
export const getByCouponId = query({
  args: {
    couponId: v.id('coupon'),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.couponId, 'couponId');
    return await ctx.db
      .query('coupon_transaction')
      .withIndex('by_coupon_id', (q) =>
        q.eq('couponId', args.couponId).eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort || 'desc')
      .paginate(args.paginationOpts);
  },
});

// 顧客IDからクーポン取引履歴を取得
export const getByCustomerId = query({
  args: {
    customerId: v.id('customer'),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.customerId, 'customerId');
    return await ctx.db
      .query('coupon_transaction')
      .withIndex('by_customer_id', (q) =>
        q.eq('customerId', args.customerId).eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort || 'desc')
      .paginate(args.paginationOpts);
  },
});

// 予約IDからクーポン取引を取得
export const getByReservationId = query({
  args: {
    reservationId: v.id('reservation'),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.reservationId, 'reservationId');
    return await ctx.db
      .query('coupon_transaction')
      .withIndex('by_reservation_id', (q) =>
        q.eq('reservationId', args.reservationId).eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort || 'desc')
      .paginate(args.paginationOpts);
  },
});
