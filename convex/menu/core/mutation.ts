import { mutation } from '@/convex/_generated/server';
import { v } from 'convex/values';
import {
  removeEmptyFields,
  killRecord,
  archiveRecord,
} from '@/services/convex/shared/utils/helper';
import { validateMenu, validateRequired } from '@/services/convex/shared/utils/validation';
import { checkAuth } from '@/services/convex/shared/utils/auth';
import { ConvexCustomError } from '@/services/convex/shared/utils/error';
import {
  genderType,
  targetType,
  menuPaymentMethodType,
} from '@/services/convex/shared/types/common';

// メニューの追加
export const create = mutation({
  args: {
    salonId: v.id('salon'),
    name: v.optional(v.string()),
    unitPrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    timeToMin: v.optional(v.number()),
    imgPath: v.optional(v.string()),
    description: v.optional(v.string()),
    targetGender: v.optional(genderType),
    targetType: v.optional(targetType),
    tags: v.optional(v.array(v.string())),
    paymentMethod: v.optional(menuPaymentMethodType),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateMenu(args);
    // サロンの存在確認
    const salon = await ctx.db.get(args.salonId);
    if (!salon) {
      const err = new ConvexCustomError('low', '指定されたサロンが存在しません', 'NOT_FOUND', 404, {
        ...args,
      });
      throw err;
    }

    const menuId = await ctx.db.insert('menu', {
      ...args,
      isArchive: false,
    });
    return menuId;
  },
});

// メニュー情報の更新
export const update = mutation({
  args: {
    menuId: v.id('menu'),
    name: v.optional(v.string()),
    unitPrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    timeToMin: v.optional(v.number()),
    imgPath: v.optional(v.string()),
    description: v.optional(v.string()),
    targetGender: v.optional(genderType),
    targetType: v.optional(targetType),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    paymentMethod: v.optional(menuPaymentMethodType),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateMenu(args);
    // メニューの存在確認
    const menu = await ctx.db.get(args.menuId);
    if (!menu || menu.isArchive) {
      const err = new ConvexCustomError(
        'low',
        '指定されたメニューが存在しません',
        'NOT_FOUND',
        404,
        {
          ...args,
        }
      );
      throw err;
    }

    const updateData = removeEmptyFields(args);
    // menuId はパッチ対象から削除する
    delete updateData.menuId;

    const newMenuId = await ctx.db.patch(args.menuId, updateData);
    return newMenuId;
  },
});

// メニューの削除
export const archive = mutation({
  args: {
    menuId: v.id('menu'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.menuId, 'menuId');
    return await archiveRecord(ctx, args.menuId);
  },
});

export const upsert = mutation({
  args: {
    menuId: v.id('menu'),
    salonId: v.id('salon'),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    timeToMin: v.optional(v.number()),
    imgPath: v.optional(v.string()),
    description: v.optional(v.string()),
    targetGender: v.optional(genderType),
    targetType: v.optional(targetType),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateMenu(args);
    // メニューの存在確認
    const existingMenu = await ctx.db.get(args.menuId);

    if (!existingMenu || existingMenu.isArchive) {
      return await ctx.db.insert('menu', {
        ...args,
        salonId: args.salonId,
        isArchive: false,
      });
    } else {
      const updateData = removeEmptyFields(args);
      delete updateData.menuId;
      delete updateData.salonId;
      return await ctx.db.patch(existingMenu._id, updateData);
    }
  },
});

export const kill = mutation({
  args: {
    menuId: v.id('menu'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.menuId, 'menuId');
    await killRecord(ctx, args.menuId);
  },
});
