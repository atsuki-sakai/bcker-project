import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';
import { validateMenu, validateRequired } from '@/services/convex/shared/utils/validation';
import { checkAuth } from '@/services/convex/shared/utils/auth';
import { genderType, targetType } from '@/services/convex/shared/types/common';
import { paginationOptsValidator } from 'convex/server';
// メニューIDからメニューを取得
export const get = query({
  args: {
    menuId: v.id('menu'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.menuId, 'menuId');
    return await ctx.db.get(args.menuId);
  },
});

// サロンIDからメニュー一覧を取得
export const listBySalonId = query({
  args: {
    salonId: v.id('salon'),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    activeOnly: v.optional(v.boolean()),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateMenu(args);
    return await ctx.db
      .query('menu')
      .withIndex('by_salon_id', (q) =>
        q.eq('salonId', args.salonId).eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort || 'desc')
      .paginate(args.paginationOpts);
  },
});

// タイプでメニューを取得
export const findByType = query({
  args: {
    salonId: v.id('salon'),
    targetType: targetType,
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    activeOnly: v.optional(v.boolean()),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateMenu(args);
    return await ctx.db
      .query('menu')
      .withIndex('by_salon_id_type', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('targetType', args.targetType)
          .eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort || 'desc')
      .paginate(args.paginationOpts);
  },
});

// 性別でメニューを取得
export const findByGender = query({
  args: {
    salonId: v.id('salon'),
    targetGender: genderType,
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    activeOnly: v.optional(v.boolean()),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateMenu(args);
    return await ctx.db
      .query('menu')
      .withIndex('by_salon_id_gender', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('targetGender', args.targetGender)
          .eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort || 'desc')
      .paginate(args.paginationOpts);
  },
});
