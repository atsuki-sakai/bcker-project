import { mutation } from '@/convex/_generated/server';

import { v } from 'convex/values';
import { excludeFields, archiveRecord, killRecord } from '@/services/convex/shared/utils/helper';
import { checkAuth } from '@/services/convex/shared/utils/auth';
import { staffScheduleType } from '@/services/convex/shared/types/common';
import {
  validateStaffScheduleException,
  validateRequired,
} from '@/services/convex/shared/utils/validation';
import { throwConvexError } from '@/lib/error';
// スタッフスケジュール例外の追加
export const add = mutation({
  args: {
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    date: v.optional(v.string()),
    startTime_unix: v.optional(v.number()),
    endTime_unix: v.optional(v.number()),
    notes: v.optional(v.string()),
    type: v.optional(staffScheduleType),
    isAllDay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateStaffScheduleException(args);
    // スタッフの存在確認
    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw throwConvexError({
        message: '指定されたスタッフが存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたスタッフが存在しません',
        callFunc: 'schedule.staff_exception.add',
        severity: 'low',
        details: { ...args },
      });
    }

    // サロンの存在確認
    const salon = await ctx.db.get(args.salonId);
    if (!salon) {
      throw throwConvexError({
        message: '指定されたサロンが存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたサロンが存在しません',
        callFunc: 'schedule.staff_exception.add',
        severity: 'low',
        details: { ...args },
      });
    }

    return await ctx.db.insert('staff_schedule', {
      ...args,
      isArchive: false,
    });
  },
});

// スタッフスケジュール例外情報の更新
export const update = mutation({
  args: {
    staffScheduleId: v.id('staff_schedule'),
    date: v.optional(v.string()),
    startTime_unix: v.optional(v.number()),
    endTime_unix: v.optional(v.number()),
    notes: v.optional(v.string()),
    type: v.optional(staffScheduleType),
    isAllDay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateStaffScheduleException(args);
    // スタッフスケジュール例外の存在確認
    const staffSchedule = await ctx.db.get(args.staffScheduleId);
    if (!staffSchedule || staffSchedule.isArchive) {
      throw throwConvexError({
        message: '指定されたスタッフスケジュール例外が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたスタッフスケジュール例外が存在しません',
        callFunc: 'schedule.staff_exception.update',
        severity: 'low',
        details: { ...args },
      });
    }

    const updateData = excludeFields(args, ['staffScheduleId']);
    return await ctx.db.patch(args.staffScheduleId, updateData);
  },
});

// スタッフスケジュール例外の削除
export const archive = mutation({
  args: {
    staffScheduleId: v.id('staff_schedule'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.staffScheduleId, 'staffScheduleId');
    return await archiveRecord(ctx, args.staffScheduleId);
  },
});

export const upsert = mutation({
  args: {
    staffScheduleId: v.id('staff_schedule'),
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    date: v.optional(v.string()),
    startTime_unix: v.optional(v.number()),
    endTime_unix: v.optional(v.number()),
    notes: v.optional(v.string()),
    type: v.optional(staffScheduleType),
    isAllDay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateStaffScheduleException(args);
    const existingStaffSchedule = await ctx.db.get(args.staffScheduleId);

    if (!existingStaffSchedule || existingStaffSchedule.isArchive) {
      return await ctx.db.insert('staff_schedule', {
        ...args,
        isArchive: false,
      });
    } else {
      const updateData = excludeFields(args, ['staffScheduleId', 'staffId', 'salonId']);
      return await ctx.db.patch(existingStaffSchedule._id, updateData);
    }
  },
});

export const kill = mutation({
  args: {
    staffScheduleId: v.id('staff_schedule'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateRequired(args.staffScheduleId, 'staffScheduleId');
    return await killRecord(ctx, args.staffScheduleId);
  },
});

export const upsertSchedules = mutation({
  args: {
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    dates: v.array(
      v.object({
        date: v.string(),
        startTime_unix: v.number(),
        endTime_unix: v.number(),
        notes: v.optional(v.string()),
        isAllDay: v.optional(v.boolean()),
      })
    ),
    type: v.optional(staffScheduleType),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx);
    validateStaffScheduleException(args);
    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw throwConvexError({
        message: '指定されたスタッフが存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたスタッフが存在しません',
        callFunc: 'schedule.staff_exception.upsertSchedules',
        severity: 'low',
        details: { ...args },
      });
    }
    const salon = await ctx.db.get(args.salonId);
    if (!salon) {
      throw throwConvexError({
        message: '指定されたサロンが存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたサロンが存在しません',
        callFunc: 'schedule.staff_exception.upsertSchedules',
        severity: 'low',
        details: { ...args },
      });
    }

    // 引数に渡された日付のセットを作成
    const providedDates = new Set(args.dates.map((date) => date.date));

    // 既存のスケジュールを取得（isArchiveフラグに関わらず全て取得）
    const existingSchedules = await ctx.db
      .query('staff_schedule')
      .withIndex('by_salon_staff_id', (q) =>
        q.eq('salonId', args.salonId).eq('staffId', args.staffId)
      )
      .collect();

    // 引数に含まれていない日付のスケジュールを完全に削除
    await Promise.all(
      existingSchedules
        .filter((schedule) => !providedDates.has(schedule.date ?? ''))
        .map((schedule) => ctx.db.delete(schedule._id))
    );

    // 引数の日付に対してupsert処理
    await Promise.all(
      args.dates.map(async (date) => {
        // 既存のスケジュールを確認（isArchiveフラグに関わらず）
        const existingSchedule = await ctx.db
          .query('staff_schedule')
          .withIndex('by_salon_staff_date', (q) =>
            q.eq('salonId', args.salonId).eq('staffId', args.staffId).eq('date', date.date)
          )
          .first();

        if (existingSchedule) {
          // 既存のレコードを更新
          await ctx.db.patch(existingSchedule._id, {
            startTime_unix: date.startTime_unix,
            endTime_unix: date.endTime_unix,
            type: args.type,
            notes: date.notes,
            isAllDay: date.isAllDay,
            isArchive: false, // 念のためisArchiveをfalseに設定
          });
        } else {
          // 新しいレコードを挿入
          await ctx.db.insert('staff_schedule', {
            staffId: args.staffId,
            salonId: args.salonId,
            date: date.date,
            startTime_unix: date.startTime_unix,
            endTime_unix: date.endTime_unix,
            type: args.type,
            notes: date.notes,
            isAllDay: date.isAllDay,
            isArchive: false,
          });
        }
      })
    );
  },
});
