export const STRIPE_API_VERSION = "2025-02-24.acacia";

// 価格設定（月額）
const MONTHLY_PRICES = {
  LITE: 6000,
  PRO: 10000,
  ENTERPRISE: 16000,
};

// 価格設定（年額 - 月額の10ヶ月分で2ヶ月分割引）
const YEARLY_PRICES = {
  LITE: 50000,
  PRO: 100000,
  ENTERPRISE: 153600,
};

// Stripe Subscription Plans
export const SUBSCRIPTION_PLANS = {
  LITE: {
    id: "lite",
    name: "Lite",
    features: [
      "予約カレンダー基本機能",
      "最大3名までのスタッフ管理",
      "基本的なお客様情報管理",
    ],
    monthly: {
      priceId: process.env.NEXT_PUBLIC_LITE_MONTHLY_PRC_ID!,
      price: MONTHLY_PRICES.LITE,
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_LITE_YEARLY_PRC_ID!,
      price: YEARLY_PRICES.LITE,
      savingPercent: 17, // 2/12 = 約17%
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    features: [
      "Liteプランの全機能",
      "最大8名までのスタッフ管理",
      "詳細な顧客管理機能",
      "予約自動リマインド",
    ],
    monthly: {
      priceId: process.env.NEXT_PUBLIC_PRO_MONTHLY_PRC_ID!,
      price: MONTHLY_PRICES.PRO,
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_PRO_YEARLY_PRC_ID!,
      price: YEARLY_PRICES.PRO,
      savingPercent: 17,
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    features: [
      "Proプランの全機能",
      "スタッフ人数無制限",
      "高度な予約分析と統計",
      "カスタマーサポート優先対応",
      "ポイント機能",
    ],
    monthly: {
      priceId: process.env.NEXT_PUBLIC_ENTRPIS_MONTHLY_PRC_ID!,
      price: MONTHLY_PRICES.ENTERPRISE,
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_ENTRPIS_YEARLY_PRC_ID!,
      price: YEARLY_PRICES.ENTERPRISE,
      savingPercent: 20,
    },
  }
};

// Staff Auth
// Cookieの名前
export const STAFF_TOKEN_COOKIE = 'bcker_staff_token';
// Cookieの有効期限（日数）
export const COOKIE_EXPIRES_DAYS = 7;
// クライアントサイドでのローカルストレージのキー
export const STAFF_TOKEN_STORAGE_KEY = 'bcker_staff_auth_token';

// ############################################################
// CONVEX API
// ############################################################

// ポイントの最大利用数
export const MAX_USE_POINTS = 10000;
// 合計金額の最大値
export const MAX_TOTAL_PRICE = 1000000;
// 備考の最大文字数
export const MAX_NOTES_LENGTH = 1000;
// スタッフ認証コードの文字数
export const MAX_STAFF_AUTH_CODE_LENGTH = 6;
// ポイントの有効期限の最大値
export const MAX_POINT_EXPIRATION_DAYS = 365;
// ポイント付与率の最大値
export const MAX_POINT_RATE = 0.9;
// 固定ポイントの最大値
export const MAX_FIXED_POINT = 10000;
// ポイントの最大値
export const MAX_POINTS = 10000;
// クーポンの最大利用回数
export const LIMIT_USE_COUPON_COUNT = 10000;
// テキストの最大文字数
export const MAX_TEXT_LENGTH = 255;
// クーポン識別IDの文字数
export const MAX_COUPON_UID_LENGTH = 8;
// タグの最大文字数
export const MAX_TAG_LENGTH = 20;
// タグの最大数
export const LIMIT_TAG_COUNT = 5;
// 電話番号の最大文字数
export const MAX_PHONE_LENGTH = 11;
// 注文制限の最大値
export const MAX_ORDER_LIMIT = 50;
// カテゴリの最大文字数
export const MAX_CATEGORY_LENGTH = 20;
// 郵便番号の最大文字数
export const MAX_POSTAL_CODE_LENGTH = 7;
// 住所の最大文字数
export const MAX_ADDRESS_LENGTH = 200;
// 何日前までキャンセル可能日数の最大値
export const MAX_AVAILABLE_CANCEL_DAYS = 30;
// ピンコードの最大文字数
export const MAX_PIN_CODE_LENGTH = 20;
// ハッシュ化されたピンコードの最大文字数
export const MAX_HASH_PIN_CODE_LENGTH = 255;
// 時間給の最大値
export const MAX_HOURLY_RATE = 100000;
// 指名料金の最大値
export const MAX_EXTRA_CHARGE = 100000;
// 優先度の最大値
export const MAX_PRIORITY = 100;
