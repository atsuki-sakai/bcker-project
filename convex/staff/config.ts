import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import {
  removeEmptyFields,
  archiveRecord,
  killRecord,
} from '@/services/convex/shared/utils/helper';
import { checkAuth } from '@/services/convex/shared/utils/auth';
import { ConvexCustomError } from '@/services/convex/shared/utils/error';
import { validateStaffConfig, validateRequired } from '@/services/convex/shared/utils/validation';

// スタッフ設定の追加
export const add = mutation({
  args: {
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    extraCharge: v.optional(v.number()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // スタッフの存在確認
    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw new ConvexCustomError('low', '指定されたスタッフが存在しません', 'NOT_FOUND', 404, {
        ...args,
      });
    }

    // サロンの存在確認
    const salon = await ctx.db.get(args.salonId);
    if (!salon) {
      throw new ConvexCustomError('low', '指定されたサロンが存在しません', 'NOT_FOUND', 404, {
        ...args,
      });
    }

    return await ctx.db.insert('staff_config', {
      ...args,
      isArchive: false,
    });
  },
});

// スタッフ設定情報の更新
export const update = mutation({
  args: {
    staffConfigId: v.id('staff_config'),
    extraCharge: v.optional(v.number()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateStaffConfig(args);
    // スタッフ設定の存在確認
    const staffConfig = await ctx.db.get(args.staffConfigId);
    if (!staffConfig || staffConfig.isArchive) {
      throw new ConvexCustomError('low', '指定されたスタッフ設定が存在しません', 'NOT_FOUND', 404, {
        ...args,
      });
    }

    const updateData = removeEmptyFields(args);
    // staffConfigId はパッチ対象から削除する
    delete updateData.staffConfigId;

    return await ctx.db.patch(args.staffConfigId, updateData);
  },
});

// スタッフ設定の削除
export const archive = mutation({
  args: {
    staffConfigId: v.id('staff_config'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.staffConfigId, 'staffConfigId');
    return await archiveRecord(ctx, args.staffConfigId);
  },
});

export const upsert = mutation({
  args: {
    staffConfigId: v.id('staff_config'),
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    extraCharge: v.optional(v.number()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateStaffConfig(args);
    const existingStaffConfig = await ctx.db.get(args.staffConfigId);
    if (!existingStaffConfig || existingStaffConfig.isArchive) {
      return await ctx.db.insert('staff_config', {
        ...args,
        isArchive: false,
      });
    } else {
      const updateData = removeEmptyFields(args);
      delete updateData.staffConfigId;
      delete updateData.staffId;
      delete updateData.salonId;
      return await ctx.db.patch(existingStaffConfig._id, updateData);
    }
  },
});

export const kill = mutation({
  args: {
    staffConfigId: v.id('staff_config'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.staffConfigId, 'staffConfigId');
    return await killRecord(ctx, args.staffConfigId);
  },
});

//スタッフIDからスタッフ設定を取得
export const getByStaffId = query({
  args: {
    staffId: v.id('staff'),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateStaffConfig(args);
    return await ctx.db
      .query('staff_config')
      .withIndex('by_staff_id', (q) =>
        q.eq('staffId', args.staffId).eq('isArchive', args.includeArchive || false)
      )
      .first();
  },
});
