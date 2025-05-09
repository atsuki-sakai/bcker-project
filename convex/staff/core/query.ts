import { dayOfWeekType } from './../../../services/convex/shared/types/common'
import { query } from '@/convex/_generated/server'
import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { validateStaff } from '@/services/convex/shared/utils/validation'
import { checkAuth } from '@/services/convex/shared/utils/auth'
import { throwConvexError } from '@/lib/error'
import { genderType } from '@/services/convex/shared/types/common'
import { validateRequired } from '@/services/convex/shared/utils/validation'
// サロンIDとメールアドレスからスタッフを取得
export const getById = query({
  args: {
    id: v.id('staff'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx)
    const staff = await ctx.db.get(args.id)
    if (!staff) {
      throw throwConvexError({
        message: '指定されたスタッフが存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたスタッフが存在しません',
        callFunc: 'staff.core.getById',
        severity: 'low',
        details: { ...args },
      })
    }
    return staff
  },
})

// サロンIDからスタッフ一覧を取得
export const getStaffListBySalonId = query({
  args: {
    salonId: v.id('salon'),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx, true)
    validateStaff(args)
    return await ctx.db
      .query('staff')
      .withIndex('by_salon_id', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('isActive', true)
          .eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort ?? 'desc')
      .paginate(args.paginationOpts)
  },
})

// スタッフ名で検索
export const getStaffListByName = query({
  args: {
    name: v.string(),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx)
    validateStaff(args)
    return await ctx.db
      .query('staff')
      .withIndex('by_name', (q) =>
        q
          .eq('name', args.name)
          .eq('isActive', true)
          .eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort ?? 'desc')
      .paginate(args.paginationOpts)
  },
})

// メールアドレスでスタッフを検索
export const getStaffListByEmail = query({
  args: {
    email: v.string(),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx)
    validateStaff(args)
    return await ctx.db
      .query('staff')
      .withIndex('by_email', (q) =>
        q
          .eq('email', args.email)
          .eq('isActive', true)
          .eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort ?? 'desc')
      .paginate(args.paginationOpts)
  },
})

// サロンIDとスタッフ名でスタッフを検索
export const getStaffListBySalonIdAndName = query({
  args: {
    salonId: v.id('salon'),
    name: v.string(),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx)
    validateStaff(args)
    return await ctx.db
      .query('staff')
      .withIndex('by_salon_id_name', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('name', args.name)
          .eq('isActive', true)
          .eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort ?? 'desc')
      .paginate(args.paginationOpts)
  },
})

// サロンIDとメールアドレスでスタッフを検索
export const getBySalonIdAndEmail = query({
  args: {
    salonId: v.id('salon'),
    email: v.string(),
    paginationOpts: paginationOptsValidator,
    sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx)
    validateStaff(args)
    return await ctx.db
      .query('staff')
      .withIndex('by_salon_id_email', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('email', args.email)
          .eq('isActive', true)
          .eq('isArchive', args.includeArchive || false)
      )
      .order(args.sort ?? 'desc')
      .paginate(args.paginationOpts)
  },
})

// 関連するテーブルの取得
export const getRelatedTables = query({
  args: {
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    includeArchive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx)
    validateStaff(args)
    // staffの取得にもisArchiveチェックを追加
    const staff = await ctx.db.get(args.staffId)
    if (!staff) {
      throw throwConvexError({
        message: '指定されたスタッフが存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたスタッフが存在しません',
        callFunc: 'staff.core.getRelatedTables',
        severity: 'low',
        details: { ...args },
      })
    }

    // 残りのデータを並列で取得
    const [staffConfig, staffAuth] = await Promise.all([
      ctx.db
        .query('staff_config')
        .withIndex('by_staff_id', (q) =>
          q.eq('staffId', args.staffId).eq('isArchive', args.includeArchive || false)
        )
        .first(),
      ctx.db
        .query('staff_auth')
        .withIndex('by_staff_id', (q) =>
          q.eq('staffId', args.staffId).eq('isArchive', args.includeArchive || false)
        )
        .first(),
    ])

    if (!staffConfig) {
      throw throwConvexError({
        message: '指定されたスタッフの設定が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたスタッフの設定が存在しません',
        callFunc: 'staff.core.getRelatedTables',
        severity: 'low',
        details: { ...args },
      })
    }

    if (!staffAuth) {
      throw throwConvexError({
        message: '指定されたスタッフの認証情報が存在しません',
        status: 404,
        code: 'NOT_FOUND',
        title: '指定されたスタッフの認証情報が存在しません',
        callFunc: 'staff.core.getRelatedTables',
        severity: 'low',
        details: { ...args },
      })
    }

    return {
      salonId: staff.salonId,
      staffId: staff._id,
      name: staff.name,
      age: staff.age,
      email: staff.email,
      instagramLink: staff.instagramLink,
      gender: staff.gender,
      description: staff.description,
      imgPath: staff.imgPath,
      isActive: staff.isActive,
      tags: staff.tags,
      staffAuthId: staffAuth._id,
      role: staffAuth.role,
      staffConfigId: staffConfig._id,
      extraCharge: staffConfig.extraCharge,
      priority: staffConfig.priority,
      pinCode: staffAuth.pinCode,
      _creationTime: staff._creationTime,
    }
  },
})

export const findAvailableStaffByMenu = query({
  args: {
    salonId: v.id('salon'),
    menuId: v.id('menu'),
  },
  returns: v.array(
    v.object({
      _id: v.id('staff'),
      name: v.optional(v.string()),
      age: v.optional(v.number()),
      email: v.optional(v.string()),
      gender: v.optional(genderType),
      description: v.optional(v.string()),
      imgPath: v.optional(v.string()),
      extraCharge: v.optional(v.number()),
      priority: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    // 1. 全スタッフ取得
    const allStaff = await ctx.db
      .query('staff')
      .withIndex('by_salon_id', (q) =>
        q.eq('salonId', args.salonId).eq('isActive', true).eq('isArchive', false)
      )
      .collect()
    // 2. 除外スタッフ取得
    const exclusions = await ctx.db
      .query('menu_exclusion_staff')
      .withIndex('by_salon_menu_id', (q) =>
        q.eq('salonId', args.salonId).eq('menuId', args.menuId).eq('isArchive', false)
      )
      .collect()
    const excludedIds = new Set(exclusions.map((r) => r.staffId))
    // 3. 有効スタッフフィルタ
    const availableStaff = allStaff.filter((staff) => !excludedIds.has(staff._id))
    // 4. 一度に staff_config を取得し、マッピング
    const configs = await ctx.db
      .query('staff_config')
      .withIndex('by_salon_id', (q) => q.eq('salonId', args.salonId).eq('isArchive', false))
      .collect()
    const configMap = new Map(configs.map((config) => [config.staffId, config]))

    // 5. 結果作成
    const result = availableStaff.map((staff) => {
      const config = configMap.get(staff._id)
      return {
        _id: staff._id,
        name: staff.name,
        age: staff.age,
        email: staff.email,
        gender: staff.gender,
        description: staff.description,
        imgPath: staff.imgPath,
        extraCharge: config?.extraCharge,
        priority: config?.priority,
      }
    })
    return result
  },
})

export const findSchedule = query({
  args: {
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    dayOfWeek: v.optional(dayOfWeekType),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx, true)
    validateStaff(args)
    const staffSchedules = await ctx.db
      .query('staff_schedule')
      .withIndex('by_salon_staff_id', (q) =>
        q.eq('salonId', args.salonId).eq('staffId', args.staffId).eq('isArchive', false)
      )
      .collect()
    const weekSchedule = await ctx.db
      .query('staff_week_schedule')
      .withIndex('by_salon_id_staff_id_day_of_week', (q) =>
        q
          .eq('salonId', args.salonId)
          .eq('staffId', args.staffId)
          .eq('dayOfWeek', args.dayOfWeek)
          .eq('isArchive', false)
      )
      .first()
    return {
      schedules: staffSchedules
        .sort((a, b) => (a.startTime_unix ?? 0) - (b.startTime_unix ?? 0))
        .map((schedule) => ({
          type: schedule.type,
          date: schedule.date,
          startTime_unix: schedule.startTime_unix,
          endTime_unix: schedule.endTime_unix,
          isAllDay: schedule.isAllDay ?? false,
        })),
      week: {
        dayOfWeek: weekSchedule?.dayOfWeek,
        isOpen: weekSchedule?.isOpen,
        startHour: weekSchedule?.startHour,
        endHour: weekSchedule?.endHour,
      },
    }
  },
})

export const listDisplayData = query({
  args: {
    salonId: v.id('salon'),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx, true)
    validateStaff(args)

    const staffs = await ctx.db
      .query('staff')
      .withIndex('by_salon_id', (q) =>
        q.eq('salonId', args.salonId).eq('isActive', true).eq('isArchive', false)
      )
      .collect()
    console.log('staffs', staffs)
    const staffConfigs = await ctx.db
      .query('staff_config')
      .withIndex('by_salon_id', (q) => q.eq('salonId', args.salonId).eq('isArchive', false))
      .collect()
    console.log('staffConfigs', staffConfigs)

    return staffs.map((staff) => ({
      _id: staff._id,
      name: staff.name,
      age: staff.age,
      email: staff.email,
      instagramLink: staff.instagramLink,
      gender: staff.gender,
      description: staff.description,
      imgPath: staff.imgPath,
      isActive: staff.isActive,
      tags: staff.tags,
      _creationTime: staff._creationTime,
      extraCharge: staffConfigs.find((config) => config.staffId === staff._id)?.extraCharge,
      priority: staffConfigs.find((config) => config.staffId === staff._id)?.priority,
      featuredHairimgPath: staff.featuredHairimgPath,
    }))
  },
})

export const findByAvailableStaffs = query({
  args: {
    salonId: v.id('salon'),
    menuIds: v.array(v.id('menu')),
  },
  handler: async (ctx, args) => {
    checkAuth(ctx, true)
    validateRequired(args.salonId, 'salonId')

    // 1. 全スタッフ取得（アクティブかつアーカイブされていない）
    const allStaff = await ctx.db
      .query('staff')
      .withIndex('by_salon_id', (q) =>
        q.eq('salonId', args.salonId).eq('isActive', true).eq('isArchive', false)
      )
      .collect()

    // 2. 各メニューに対応しないスタッフ（除外スタッフ）を取得して集約
    const excludedIds = new Set<string>()
    for (const menuId of args.menuIds) {
      const exclusions = await ctx.db
        .query('menu_exclusion_staff')
        .withIndex('by_salon_menu_id', (q) =>
          q.eq('salonId', args.salonId).eq('menuId', menuId).eq('isArchive', false)
        )
        .collect()
      exclusions.forEach((ex) => excludedIds.add(ex.staffId))
    }

    // 3. 除外されたスタッフを除去
    const availableStaff = allStaff.filter((staff) => !excludedIds.has(staff._id))

    // 4. スタッフ設定を取得してマッピング (指名料、優先度)
    const configs = await ctx.db
      .query('staff_config')
      .withIndex('by_salon_id', (q) => q.eq('salonId', args.salonId).eq('isArchive', false))
      .collect()
    const configMap = new Map(configs.map((config) => [config.staffId, config]))

    // 5. 結果を整形して返却
    return availableStaff.map((staff) => {
      const config = configMap.get(staff._id)
      return {
        _id: staff._id,
        name: staff.name,
        age: staff.age,
        email: staff.email,
        gender: staff.gender,
        description: staff.description,
        imgPath: staff.imgPath,
        isActive: staff.isActive,
        tags: staff.tags,
        _creationTime: staff._creationTime,
        instagramLink: staff.instagramLink,
        featuredHairimgPath: staff.featuredHairimgPath,
        extraCharge: config?.extraCharge,
        priority: config?.priority,
      }
    })
  },
})
