import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  CommonFields,
  dayOfWeekType,
  billingPeriodType,
  reservationStatusType,
  salonScheduleExceptionType,
  staffScheduleType,
  menuPaymentMethodType,
  paymentMethodType,
  roleType,
  pointTransactionType,
  targetType,
  genderType,
  reservationIntervalMinutesType,
  menuCategoryType,
} from '../services/convex/shared/types/common';

/**
 * Convexスキーマ定義
 * 時間はUNIXタイム（ミリ秒）で管理し、取得後に日本時間に変換する
 * 日付の文字列は YYYY-MM-DD 形式、時間は HH:MM の形式で保存
 */

/**
 * 予約の空き時間を計算する処理のロジック
 * 1. まずサロンのアクティブなスタッフ全員を取得して表示する。表示したスタッフを顧客に選択してもらう。スタッフを指名しない場合は全スタッフが対象になります。
 * 2. 選択されたスタッフが対応可能なメニュー、オプションを表示する。指名しない場合はサロンに登録されているアクティブな全てのメニュー、オプションを表示する。
 * 3. 予約日(YYYY-MM-DD)を選択してもらい、staff_available_slotsテーブルから指名したスタッフの指定日の空き時間を取得する。スロットがまだ無ければ指定日をdateにしたのstaff_available_slotsテーブルを作成する。スタッフを指名しない場合は指定したメニューとオプションに対応できるスタッフでpriorityの一番高いスタッフの指定日の空き時間を取得する、この時ももしスロットが無ければ作成する。
 * 4. 空き時間を取得したら、選択したメニューとオプションの施術時間で予約可能な空き時間を表示する。スタッフを指名しない場合は指定したメニューとオプションに対応できるスタッフのなかでpriorityが一番高いスタッフの予約可能な時間を表示する。
 * 5. 空き時間を選択してもらい、予約を作成する。
 * 6. 予約を作成する。
 * 7. ポイント利用時はreservation_point_authテーブルを作成して、利用時に使用するコードを生成し、顧客にもLineで通知する。利用時に店舗でauthCodeを店舗で店員に見せて、店員が入力コードが合っていればポイントを利用する。ポイントトランザクションにはポイント利用の記録を作成する。利用が完了した際にreservation_point_authテーブルのレコードを削除する。予約のキャンセル時にはreservation_point_authテーブルのレコードを削除する。
 * 8. ポイント付与時は。予約が完了した際にpoint_queueテーブルにポイント付与の記録を作成する。scheduledFor_unixの利用時の翌月15日にスケジュール関数でポイント付与する。付与時にトランザクションを作成し、ポイント付与の記録を作成する。完了時にpoint_queueテーブルのレコードを削除する。予約のキャンセル時にはpoint_queueテーブルのレコードを削除する。
 */
export default defineSchema({
  // =====================
  // ADMIN
  // =====================
  // サービス管理者テーブル
  admin: defineTable({
    clerkId: v.string(),
    email: v.string(),
    password: v.string(),
    ...CommonFields,
  }).index('by_clerk_id', ['clerkId']),

  // =====================
  // SUBSCRIPTION
  // =====================
  // サブスクリプション関連テーブル
  subscription: defineTable({
    subscriptionId: v.string(), // StripeサブスクリプションID
    stripeCustomerId: v.string(), // Stripe顧客ID (userとの関連)
    status: v.string(), // ステータス ("active", "past_due", "canceled", etc.)
    priceId: v.optional(v.string()), // 購読プランID (Price ID)
    planName: v.optional(v.string()), // プラン名 ("Lite", "Pro", "Enterprise")
    billingPeriod: v.optional(billingPeriodType), // 課金期間 (月額 or 年額)
    currentPeriodEnd: v.optional(v.number()), // 現在の課金期間の終了タイムスタンプ
    ...CommonFields,
  })
    .index('by_subscription_id', ['subscriptionId', 'isArchive'])
    .index('by_stripe_customer_id', ['stripeCustomerId', 'isArchive']),

  // =====================
  // OPTION
  // =====================

  // サロンで販売するオプションテーブル
  salon_option: defineTable({
    salonId: v.id('salon'),
    name: v.string(), // オプションメニュー名
    unitPrice: v.optional(v.number()), // 価格
    salePrice: v.optional(v.number()), // セール価格
    orderLimit: v.optional(v.number()), // 注文制限
    timeToMin: v.optional(v.number()), // 時間(分)
    ensureTimeToMin: v.optional(v.number()), // 座席を確保する時間(分): パーマなどの場合作業時間と確保する時間の差分の待ち時間が発生する為、予約枠の計算はtimeToMinを使用して効率的に予約できるようにするため
    tags: v.optional(v.array(v.string())), // タグ
    description: v.optional(v.string()), // 説明
    isActive: v.optional(v.boolean()), // 有効/無効フラグ
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_salon_id_name', ['salonId', 'name', 'isArchive']),

  // =====================
  // SALON
  // =====================
  // サロンテーブル
  salon: defineTable({
    clerkId: v.string(), // ClerkのユーザーID
    stripeConnectId: v.optional(v.string()), // StripeConnect連携アカウントID
    stripeConnectStatus: v.optional(v.string()), // StripeConnect連携状態
    stripeConnectCreatedAt: v.optional(v.number()), // StripeConnect作成日時
    stripeCustomerId: v.optional(v.string()), // Stripe顧客ID
    email: v.optional(v.string()), // Emailアドレス
    subscriptionId: v.optional(v.string()), // 現在のサブスクリプションID
    subscriptionStatus: v.optional(v.string()), // サブスクリプション状態
    planName: v.optional(v.string()), // プラン名 ("lite", "pro", "enterprise")
    priceId: v.optional(v.string()), // 購読プランID (Price ID)
    billingPeriod: v.optional(billingPeriodType), // 課金期間 (月額 or 年額)
    ...CommonFields,
  })
    .index('by_clerk_id', ['clerkId', 'isArchive'])
    .index('by_stripe_connect_id', ['stripeConnectId', 'isArchive'])
    .index('by_stripe_customer_id', ['stripeCustomerId', 'isArchive'])
    .index('by_email', ['email', 'isArchive']),

  // サロンのAPI設定テーブル
  salon_api_config: defineTable({
    salonId: v.id('salon'),
    lineAccessToken: v.optional(v.string()), // LINEアクセストークン
    lineChannelSecret: v.optional(v.string()), // LINEチャンネルシークレット
    liffId: v.optional(v.string()), // LIFF ID
    destinationId: v.optional(v.string()), // LINE公式アカウント識別子
    ...CommonFields,
  }).index('by_salon_id', ['salonId', 'isArchive']),

  // サロンの基本設定テーブル
  salon_config: defineTable({
    salonId: v.id('salon'),
    salonName: v.optional(v.string()), // サロン名
    email: v.optional(v.string()), // メールアドレス
    phone: v.optional(v.string()), // 電話番号
    postalCode: v.optional(v.string()), // 郵便番号
    address: v.optional(v.string()), // 住所
    reservationRules: v.optional(v.string()), // 予約ルール
    imgPath: v.optional(v.string()), // 画像ファイルパス
    description: v.optional(v.string()), // 説明
    ...CommonFields,
  }).index('by_salon_id', ['salonId', 'isArchive']),

  // サロンの営業スケジュール設定テーブル
  salon_schedule_config: defineTable({
    salonId: v.id('salon'),
    availableSheet: v.optional(v.number()), // 同一時間内での最大予約数(席数が最大の施術数になるので席数と同じになる)
    reservationLimitDays: v.optional(v.number()), // 現在から何日先まで予約できるかの日数
    availableCancelDays: v.optional(v.number()), // 予約キャンセル可能日数
    todayFirstLaterMinutes: v.optional(v.number()), // 本日の場合、何分後から予約可能か？
    reservationIntervalMinutes: v.optional(reservationIntervalMinutesType) || 0, // 予約時間間隔(分)
    ...CommonFields,
  }).index('by_salon_id', ['salonId', 'isArchive']),

  // サロンの紹介コードテーブル
  salon_referral: defineTable({
    salonId: v.id('salon'),
    referralCode: v.optional(v.string()), // 紹介コード
    referralCount: v.optional(v.number()), // 紹介回数
    updatedAt: v.optional(v.number()), // 加算した日時
    totalReferralCount: v.optional(v.number()), // 総紹介回数
    ...CommonFields,
  })
    .index('by_referral_count', ['referralCount', 'isArchive'])
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_referral_code', ['referralCode', 'isArchive'])
    .index('by_total_referral_count', ['totalReferralCount', 'isArchive'])
    .index('by_updated_at', ['updatedAt', 'isArchive'])
    .index('by_referral_and_total_count', ['referralCount', 'totalReferralCount', 'isArchive']),

  // =====================
  // SCHEDULE
  // =====================

  // サロンの曜日毎のスケジュールテーブル
  salon_week_schedule: defineTable({
    salonId: v.id('salon'),
    isOpen: v.optional(v.boolean()), // 営業しているか？false: 休日なので予約を受け付けない。
    dayOfWeek: v.optional(dayOfWeekType), // 営業している曜日
    startHour: v.optional(v.string()), // 営業している開始時間 例: 09:00
    endHour: v.optional(v.string()), // 営業している終了時間 例: 18:00
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_salon_week_is_open_day_of_week', ['salonId', 'dayOfWeek', 'isOpen', 'isArchive']),

  // サロンのスケジュール例外テーブル 事前に登録する(サロンの休業日を設定する)
  salon_schedule_exception: defineTable({
    salonId: v.id('salon'), // フィルタリング用
    type: v.optional(salonScheduleExceptionType), // 例外タイプ
    date: v.string(), // 日付 "YYYY-MM-DD" または "YYYY/MM/DD" 形式 この日は予約を受け付けない。
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_salon_date', ['salonId', 'date', 'isArchive'])
    .index('by_salon_date_type', ['salonId', 'date', 'type', 'isArchive'])
    .index('by_salon_type', ['salonId', 'type', 'isArchive']),

  // スタッフの曜日毎のスケジュールテーブル
  staff_week_schedule: defineTable({
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    isOpen: v.optional(v.boolean()), // 営業しているか？false: 休日なので予約を受け付けない。
    dayOfWeek: v.optional(dayOfWeekType), // 営業している曜日
    startHour: v.optional(v.string()), // 営業している開始時間 例: 09:00
    endHour: v.optional(v.string()), // 営業している終了時間 例: 18:00
    ...CommonFields,
  })
    .index('by_salon_staff_week_is_open', [
      'salonId',
      'staffId',
      'dayOfWeek',
      'isOpen',
      'isArchive',
    ])
    .index('by_staff_id', ['staffId', 'isArchive'])
    .index('by_salon_id_staff_id_day_of_week', ['salonId', 'staffId', 'dayOfWeek', 'isArchive'])
    .index('by_salon_id_staff_id', ['salonId', 'staffId', 'isArchive']),

  // スタッフのスケジュールテーブル 事前に登録する
  staff_schedule: defineTable({
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    date: v.optional(v.string()), // 予約する日付 "YYYY-MM-DD" または "YYYY/MM/DD" 形式
    startTime_unix: v.optional(v.number()), // 予約した施術の開始時間 UNIXタイム isAllDay: falseの場合はこちらで判定する予約がスケジュールに含まれるかどうかを判定するために使用
    endTime_unix: v.optional(v.number()), // 予約した施術の終了時間 UNIXタイム isAllDay: falseの場合はこちらで判定する予約がスケジュールに含まれるかどうかを判定するために使用
    notes: v.optional(v.string()), // メモ
    type: v.optional(staffScheduleType), // 予約タイプ 現状はholiday(休日)のみ
    isAllDay: v.optional(v.boolean()), // true: 全日予約, false: 時間予約(時間指定が有効指定時間内のみ予約を受け付けないためのフラグ)
    ...CommonFields,
  })
    .index('by_staff_id', ['staffId', 'isArchive'])
    .index('by_salon_staff_id', ['salonId', 'staffId', 'isArchive'])
    .index('by_salon_staff_date', ['salonId', 'staffId', 'date', 'isArchive'])
    .index('by_salon_staff_date_type', ['salonId', 'staffId', 'date', 'type', 'isArchive'])
    .index('by_staff_start_end', ['staffId', 'startTime_unix', 'endTime_unix', 'isArchive'])
    .index('by_salon_staff_all_day', ['salonId', 'staffId', 'isAllDay', 'isArchive'])
    .index('by_salon_data_start_end', [
      'salonId',
      'date',
      'startTime_unix',
      'endTime_unix',
      'isArchive',
    ])
    .index('by_salon_staff_date_all_day', ['salonId', 'staffId', 'date', 'isAllDay', 'isArchive']),

  // =====================
  // CUSTOMER
  // =====================
  // 顧客テーブル
  customer: defineTable({
    salonId: v.id('salon'), // サロンID
    lineId: v.optional(v.string()), // LINE ID
    lineUserName: v.optional(v.string()), // LINEユーザー名
    phone: v.optional(v.string()), // 電話番号
    email: v.optional(v.string()), // メールアドレス
    password: v.optional(v.string()), // パスワード
    firstName: v.optional(v.string()), // 名前
    lastName: v.optional(v.string()), // 苗字
    searchbleText: v.optional(v.string()), // 検索用テキスト
    useCount: v.optional(v.number()), // 利用回数
    lastReservationDate_unix: v.optional(v.number()), // 最終予約日
    tags: v.optional(v.array(v.string())), // タグ
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_salon_line_id', ['salonId', 'lineId', 'isArchive'])
    .index('by_salon_phone', ['salonId', 'phone', 'isArchive'])
    .index('by_salon_email', ['salonId', 'email', 'isArchive'])
    .index('by_salon_id_searchble_text', ['salonId', 'searchbleText', 'isArchive'])
    .index('by_salon_id_line_user_name', ['salonId', 'lineUserName', 'isArchive'])
    .searchIndex('search_searchble_text', {
      searchField: 'searchbleText',
      filterFields: ['salonId'],
    }),

  // 顧客の詳細テーブル
  customer_detail: defineTable({
    customerId: v.id('customer'),
    email: v.optional(v.string()), // メールアドレス
    age: v.optional(v.number()), // 年齢
    birthday: v.optional(v.string()), // 誕生日
    gender: v.optional(genderType), // 性別
    notes: v.optional(v.string()), // メモ
    ...CommonFields,
  }).index('by_customer_id', ['customerId', 'isArchive']),

  // 顧客のポイント残高
  customer_points: defineTable({
    customerId: v.id('customer'), // 顧客ID
    salonId: v.id('salon'), // サロンID
    totalPoints: v.optional(v.number()), // 保有ポイント
    lastTransactionDate_unix: v.optional(v.number()), // 最終トランザクション日時
    ...CommonFields,
  })
    .index('by_salon_customer_archive', ['salonId', 'customerId', 'isArchive'])
    .index('by_customer_id', ['customerId', 'isArchive']),

  // =====================
  // CARTE
  // =====================
  carte: defineTable({
    salonId: v.id('salon'), // サロンID
    customerId: v.id('customer'), // 顧客ID
    skinType: v.optional(v.string()), // 肌質
    hairType: v.optional(v.string()), // 髪質
    allergyHistory: v.optional(v.string()), // アレルギー歴
    medicalHistory: v.optional(v.string()), // 持病
    ...CommonFields,
  }).index('by_salon_customer', ['salonId', 'customerId', 'isArchive']),

  // 最大保存期間は1~2年間
  carte_detail: defineTable({
    carteId: v.id('carte'), // カルテID
    reservationId: v.id('reservation'), // 予約ID
    beforeHairimgPath: v.optional(v.string()), // 施術前の髪型画像ファイルパス
    afterHairimgPath: v.optional(v.string()), // 施術後の髪型画像ファイルパス
    notes: v.optional(v.string()), // メモ
    ...CommonFields,
  })
    .index('by_carte_id_reservation_id', ['carteId', 'reservationId', 'isArchive'])
    .index('by_carte_id', ['carteId', 'isArchive']),

  // =====================
  // STAFF
  // =====================
  staff: defineTable({
    salonId: v.id('salon'),
    name: v.optional(v.string()), // スタッフ名
    age: v.optional(v.number()), // 年齢
    email: v.optional(v.string()), // メールアドレス
    gender: v.optional(genderType), // 性別
    instagramLink: v.optional(v.string()), // SNSリンク
    description: v.optional(v.string()), // 説明
    imgPath: v.optional(v.string()), // 画像ファイルパス
    tags: v.optional(v.array(v.string())), // タグ
    featuredHairimgPath: v.optional(v.array(v.string())), // スタッフの過去の特集髪型画像ファイルパス
    isActive: v.optional(v.boolean()), // 有効/無効フラグ
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isActive', 'isArchive'])
    .index('by_name', ['name', 'isActive', 'isArchive'])
    .index('by_email', ['email', 'isActive', 'isArchive'])
    .index('by_salon_id_name', ['salonId', 'name', 'isActive', 'isArchive'])
    .index('by_salon_id_email', ['salonId', 'email', 'isActive', 'isArchive']),

  // スタッフの認証テーブル
  staff_auth: defineTable({
    staffId: v.id('staff'),
    pinCode: v.optional(v.string()), //　ピンコード
    role: v.optional(roleType), // ロール
    ...CommonFields,
  })
    .index('by_staff_id', ['staffId', 'isArchive'])
    .index('by_pin_code', ['pinCode', 'isArchive']),

  // スタッフのタイムカードテーブル
  time_card: defineTable({
    salonId: v.id('salon'), // サロンID
    staffId: v.id('staff'), // スタッフID
    startDateTime_unix: v.optional(v.number()), // 開始時間 UNIXタイム
    endDateTime_unix: v.optional(v.number()), // 終了時間 UNIXタイム
    workedTime: v.optional(v.number()), // 勤務時間(分)
    notes: v.optional(v.string()), // メモ
    ...CommonFields,
  })
    .index('by_salon_staff', ['salonId', 'staffId', 'isArchive'])
    .index('by_salon_staff_start_time', ['salonId', 'staffId', 'isArchive', 'startDateTime_unix'])
    .index('by_salon_start_time', ['salonId', 'startDateTime_unix', 'isArchive'])
    .index('by_salon_staff_end_time', ['salonId', 'staffId', 'endDateTime_unix', 'isArchive'])
    .index('by_salon_notes', ['salonId', 'notes', 'isArchive']),

  // スタッフの設定テーブル
  staff_config: defineTable({
    staffId: v.id('staff'),
    salonId: v.id('salon'),
    extraCharge: v.optional(v.number()), // 指名料金
    priority: v.optional(v.number()), // 予約時の優先度
    ...CommonFields,
  })
    .index('by_staff_id', ['staffId', 'isArchive'])
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_staff_id_priority', ['staffId', 'isArchive', 'priority']),

  // =====================
  // MENU
  // =====================
  // サロンのメニューテーブル
  menu: defineTable({
    salonId: v.id('salon'),
    name: v.optional(v.string()), // メニュー名
    unitPrice: v.optional(v.number()), // 単価
    salePrice: v.optional(v.number()), // セール価格
    timeToMin: v.optional(v.number()), // 時間(分): 実質の作業時間
    ensureTimeToMin: v.optional(v.number()), // 座席を確保する時間(分): パーマなどの場合作業時間と確保する時間の差分の待ち時間が発生する為、予約枠の計算はtimeToMinを使用して効率的に予約できるようにするため
    imgPath: v.optional(v.string()), // 画像ファイルパス
    description: v.optional(v.string()), // 説明
    targetGender: v.optional(genderType), // 対象性別
    targetType: v.optional(targetType), // 対象タイプ
    category: v.optional(menuCategoryType), // カテゴリ
    tags: v.optional(v.array(v.string())), // タグ
    paymentMethod: v.optional(menuPaymentMethodType), // 許可する支払い方法
    isActive: v.optional(v.boolean()), // 有効/無効フラグ
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_salon_id_name', ['salonId', 'name', 'isArchive'])
    .index('by_salon_id_gender', ['salonId', 'targetGender', 'isArchive'])
    .index('by_salon_id_type', ['salonId', 'targetType', 'isArchive'])
    .index('by_salon_id_category', ['salonId', 'category', 'isArchive']),

  menu_exclusion_staff: defineTable({
    salonId: v.id('salon'), // サロンID
    menuId: v.id('menu'), // メニューID
    staffId: v.id('staff'), // スタッフID
    ...CommonFields,
  })
    .index('by_salon_menu_staff', ['salonId', 'menuId', 'staffId', 'isArchive'])
    .index('by_salon_menu_id', ['salonId', 'menuId', 'isArchive'])
    .index('by_salon_staff_id', ['salonId', 'staffId', 'isArchive']),

  // =====================
  // PRODUCT // 未実装
  // =====================
  // サロンの商品テーブル
  product: defineTable({
    salonId: v.id('salon'),
    stripeConnectId: v.optional(v.string()), // Stripe Connect ID
    tags: v.optional(v.array(v.string())), // タグ
    name: v.optional(v.string()), // 商品名
    unitPrice: v.optional(v.number()), // 単価
    salePrice: v.optional(v.number()), // セール価格
    imgPath: v.optional(v.string()), // 画像ファイルパス
    description: v.optional(v.string()), // 説明
    targetGender: v.optional(genderType), // 対象性別
    paymentMethod: v.optional(menuPaymentMethodType), // 許可する支払い方法
    isActive: v.optional(v.boolean()), // 有効/無効フラグ
    ...CommonFields,
  }).index('by_salon_id', ['salonId', 'isArchive']),

  // =====================
  // COUPON
  // =====================
  // クーポンテーブル
  coupon: defineTable({
    salonId: v.id('salon'),
    couponUid: v.optional(v.string()), // クーポン識別ID (8桁の大文字英語と数字)
    name: v.optional(v.string()), // クーポン名
    discountType: v.optional(v.union(v.literal('fixed'), v.literal('percentage'))), // 割引タイプ
    percentageDiscountValue: v.optional(v.number()), // 割引率
    fixedDiscountValue: v.optional(v.number()), // 固定割引額
    isActive: v.optional(v.boolean()), // 有効/無効フラグ
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_name', ['name', 'isArchive'])
    .index('by_salon_coupon_uid', ['salonId', 'couponUid', 'isArchive'])
    .index('by_salon_coupon_uid_active', ['salonId', 'couponUid', 'isActive', 'isArchive']),

  coupon_exclusion_menu: defineTable({
    salonId: v.id('salon'), // サロンID
    couponId: v.id('coupon'), // クーポンID
    menuId: v.id('menu'), // メニューID
    ...CommonFields,
  })
    .index('by_salon_menu_id', ['salonId', 'menuId', 'isArchive'])
    .index('by_salon_coupon_id', ['salonId', 'couponId', 'isArchive'])
    .index('by_salon_coupon_id_menu_id', ['salonId', 'couponId', 'menuId', 'isArchive']),

  // クーポンの設定テーブル
  coupon_config: defineTable({
    salonId: v.id('salon'), // サロンID
    couponId: v.id('coupon'), // クーポンID
    startDate_unix: v.optional(v.number()), // 開始日 UNIXタイム
    endDate_unix: v.optional(v.number()), // 終了日 UNIXタイム
    maxUseCount: v.optional(v.number()), // 最大利用回数
    numberOfUse: v.optional(v.number()), // 現在の利用回数
    ...CommonFields,
  })
    .index('by_salon_coupon_id', ['salonId', 'couponId', 'isArchive'])
    .index('by_coupon_id', ['couponId', 'isArchive']),

  // クーポン取引テーブル
  coupon_transaction: defineTable({
    couponId: v.id('coupon'), // クーポンID
    customerId: v.id('customer'), // 顧客ID
    reservationId: v.id('reservation'), // 予約ID
    transactionDate_unix: v.optional(v.number()), // 利用日時 UNIXタイム
    ...CommonFields,
  })
    .index('by_coupon_id', ['couponId', 'isArchive'])
    .index('by_customer_id', ['customerId', 'isArchive'])
    .index('by_reservation_id', ['reservationId', 'isArchive'])
    .index('by_transaction_date', ['transactionDate_unix', 'isArchive']),

  // =====================
  // RESERVATION
  // =====================
  // 最大保存期間は1~2年間
  reservation: defineTable({
    customerId: v.optional(v.id('customer')), // 顧客ID
    customerName: v.optional(v.string()), // 顧客名
    staffId: v.id('staff'), // スタッフID
    staffName: v.optional(v.string()), // スタッフ名
    menus: v.optional(
      v.array(
        v.object({
          menuId: v.id('menu'),
          quantity: v.number(),
        })
      )
    ), // メニューID
    salonId: v.id('salon'), // サロンID
    options: v.optional(
      v.array(
        v.object({
          optionId: v.id('salon_option'),
          quantity: v.number(),
        })
      )
    ), // オプションID
    unitPrice: v.optional(v.number()), // 単価
    totalPrice: v.optional(v.number()), // 合計金額
    status: v.optional(reservationStatusType), // 予約ステータス
    startTime_unix: v.optional(v.number()), // 開始時間 UNIXタイム
    endTime_unix: v.optional(v.number()), // 終了時間 UNIXタイム
    usePoints: v.optional(v.number()), // 使用ポイント数
    couponId: v.optional(v.id('coupon')), // クーポンID
    couponDiscount: v.optional(v.number()), // クーポン割引額
    featuredHairimgPath: v.optional(v.string()), // 顧客が希望する髪型の画像ファイルパス
    notes: v.optional(v.string()), // 備考
    paymentMethod: v.optional(paymentMethodType), // 支払い方法
    ...CommonFields,
  })
    .index('by_salon_id', ['salonId', 'isArchive'])
    .index('by_customer_id', ['salonId', 'customerId', 'isArchive'])
    .index('by_staff_id_status', ['salonId', 'staffId', 'isArchive', 'status'])
    .index('by_status', ['salonId', 'status', 'isArchive'])
    .index('by_salon_status_start', ['salonId', 'isArchive', 'status', 'startTime_unix'])
    .index('by_staff_date', ['salonId', 'staffId', 'isArchive', 'startTime_unix'])
    .index('by_staff_date_status', ['salonId', 'staffId', 'isArchive', 'status', 'startTime_unix'])
    .index('by_customer_date', ['salonId', 'customerId', 'isArchive', 'startTime_unix'])
    .index('by_salon_staff_status_start_end', [
      'salonId',
      'staffId',
      'isArchive',
      'status',
      'startTime_unix',
      'endTime_unix',
    ]),

  // =====================
  // POINT
  // =====================

  // サロンのポイント基本設定テーブル
  point_config: defineTable({
    salonId: v.id('salon'),
    isFixedPoint: v.optional(v.boolean()), // 固定ポイントかどうか
    pointRate: v.optional(v.number()), // ポイント付与率 (例: 0.1なら10%)
    fixedPoint: v.optional(v.number()), // 固定ポイント (例: 100円につき1ポイント)
    pointExpirationDays: v.optional(v.number()), // ポイントの有効期限(日)
    ...CommonFields,
  }).index('by_salon_id', ['salonId', 'isArchive']),

  point_exclusion_menu: defineTable({
    salonId: v.id('salon'), // サロンID
    pointConfigId: v.id('point_config'), // ポイント基本設定ID
    menuId: v.id('menu'), // メニューID
    ...CommonFields,
  })
    .index('by_salon_point_config_menu', ['salonId', 'pointConfigId', 'menuId', 'isArchive'])
    .index('by_salon_point_config_id', ['salonId', 'pointConfigId', 'isArchive']),

  // ポイント付与キュー (定期処理で実行後に削除)
  point_task_queue: defineTable({
    reservationId: v.id('reservation'), // 予約ID
    customerId: v.id('customer'), // 顧客ID
    points: v.optional(v.number()), // 加算ポイント
    scheduledFor_unix: v.optional(v.number()), // 付与予定日時 UNIXタイム
    ...CommonFields,
  })
    .index('by_reservation_id', ['reservationId', 'isArchive'])
    .index('by_customer_id', ['customerId', 'isArchive'])
    .index('by_scheduled_for', ['scheduledFor_unix', 'isArchive']),

  // 予約ポイント利用時の認証 予約完了時に生成しauthCodeを顧客のLineに送付する
  point_auth: defineTable({
    reservationId: v.id('reservation'), // 予約ID
    customerId: v.id('customer'), // 顧客ID
    authCode: v.optional(v.string()), // 認証コード (6桁の大文字英語と数字)
    expirationTime_unix: v.optional(v.number()), // 有効期限 UNIXタイム
    points: v.optional(v.number()), // 利用ポイント
    ...CommonFields,
  })
    .index('by_reservation_id', ['reservationId', 'isArchive'])
    .index('by_customer_id', ['customerId', 'isArchive'])
    .index('by_expiration_time', ['expirationTime_unix', 'isArchive']),

  // ポイント取引履歴
  point_transaction: defineTable({
    salonId: v.id('salon'), // サロンID
    reservationId: v.id('reservation'), // 予約ID
    customerId: v.id('customer'), // 顧客ID
    points: v.optional(v.number()), // ポイント数 (加算減算したポイント)
    menuId: v.optional(v.id('menu')), // メニューID
    transactionType: v.optional(pointTransactionType), // トランザクションタイプ
    transactionDate_unix: v.optional(v.number()), // 取引日時 UNIXタイム
    ...CommonFields,
  })
    .index('by_salon_reservation_id', ['salonId', 'reservationId', 'isArchive'])
    .index('by_salon_customer_id', ['salonId', 'customerId', 'isArchive'])
    .index('by_salon_customer_reservation', [
      'salonId',
      'customerId',
      'reservationId',
      'isArchive',
    ]),
})
