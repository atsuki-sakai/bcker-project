import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { ConvexCustomError } from '../shared/utils/error';
import { removeEmptyFields, archiveRecord, KillRecord } from '../shared/utils/helper';
import { paginationOptsValidator } from 'convex/server';
import { salonScheduleExceptionType, dayOfWeekType } from '../shared/types/common';
import { validateRequired, validateSalonScheduleException } from '../shared/utils/validation';
import { checkAuth } from '../shared/utils/auth';

// サロンスケジュール例外の追加
export const add = mutation({
  args: {
    salonId: v.id('salon'),
    type: v.optional(salonScheduleExceptionType),
    week: v.optional(dayOfWeekType),
    date: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateSalonScheduleException(args);
    // サロンの存在確認
    const salon = await ctx.db.get(args.salonId);
    if (!salon) {
      throw new ConvexCustomError('low', '指定されたサロンが存在しません', 'NOT_FOUND', 404, {
        ...args,
      });
    }

    return await ctx.db.insert('salon_schedule_exception', {
      ...args,
      isArchive: false,
    });
  },
});

// サロンスケジュール例外の更新
export const update = mutation({
  args: {
    salonScheduleExceptionId: v.id('salon_schedule_exception'),
    type: v.optional(salonScheduleExceptionType),
    week: v.optional(dayOfWeekType),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateSalonScheduleException(args);
    // サロンスケジュール例外の存在確認
    const salonScheduleException = await ctx.db.get(args.salonScheduleExceptionId);
    if (!salonScheduleException || salonScheduleException.isArchive) {
      throw new ConvexCustomError(
        'low',
        '指定されたサロンスケジュール例外が存在しません',
        'NOT_FOUND',
        404,
        {
          ...args,
        }
      );
    }

    const updateData = removeEmptyFields(args);
    // salonScheduleExceptionId はパッチ対象から削除する
    delete updateData.salonScheduleExceptionId;

    return await ctx.db.patch(args.salonScheduleExceptionId, updateData);
  },
});

// サロンスケジュール例外の削除
export const archive = mutation({
  args: {
    salonScheduleExceptionId: v.id('salon_schedule_exception'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.salonScheduleExceptionId, 'salonScheduleExceptionId');
    return await archiveRecord(ctx, args.salonScheduleExceptionId);
  },
});

export const upsert = mutation({
  args: {
    salonScheduleExceptionId: v.id('salon_schedule_exception'),
    salonId: v.id('salon'),
    type: v.optional(salonScheduleExceptionType),
    week: v.optional(dayOfWeekType),
    date: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateSalonScheduleException(args);
    const existingSalonScheduleException = await ctx.db
      .query('salon_schedule_exception')
      .withIndex('by_salon_id', (q) => q.eq('salonId', args.salonId).eq('isArchive', false))
      .first();

    if (!existingSalonScheduleException || existingSalonScheduleException.isArchive) {
      return await ctx.db.insert('salon_schedule_exception', {
        ...args,
        isArchive: false,
      });
    } else {
      const updateData = removeEmptyFields(args);
      delete updateData.salonScheduleExceptionId;
      delete updateData.salonId;
      return await ctx.db.patch(existingSalonScheduleException._id, updateData);
    }
  },
});

export const kill = mutation({
  args: {
    salonScheduleExceptionId: v.id('salon_schedule_exception'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.salonScheduleExceptionId, 'salonScheduleExceptionId');
    return await KillRecord(ctx, args.salonScheduleExceptionId);
  },
});

export const getByScheduleList = query({
  args: {
    salonId: v.id('salon'),
    type: v.optional(salonScheduleExceptionType),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    return await ctx.db
      .query('salon_schedule_exception')
      .withIndex('by_salon_type', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('type', args.type)
          .eq('isArchive', args.includeArchive || false)
      )
      .collect();
  },
});

// サロンIDと日付からサロンスケジュール例外を取得
export const getBySalonAndDate = query({
  args: {
    salonId: v.id('salon'),
    date: v.string(),
    type: v.optional(salonScheduleExceptionType),
    paginationOpts: paginationOptsValidator,
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    return await ctx.db
      .query('salon_schedule_exception')
      .withIndex('by_salon_date_type', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('date', args.date)
          .eq('type', args.type)
          .eq('isArchive', args.includeArchive)
      )
      .paginate(args.paginationOpts);
  },
});
