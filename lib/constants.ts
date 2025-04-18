export const STRIPE_API_VERSION = '2025-02-24.acacia';

export const SALON_SCHEDULE_HOURS = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];
export const SALON_RESERVATION_CANCEL_LIMIT_DAYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
];
export const SALON_RESERVATION_LIMIT_DAYS = [
  '30',
  '60',
  '90',
  '120',
  '150',
  '180',
  '210',
  '240',
  '270',
  '300',
  '330',
  '360',
];

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
    id: 'lite',
    name: 'Lite',
    features: ['予約カレンダー基本機能', '最大3名までのスタッフ管理', '基本的なお客様情報管理'],
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
    id: 'pro',
    name: 'Pro',
    features: [
      'Liteプランの全機能',
      '最大8名までのスタッフ管理',
      '詳細な顧客管理機能',
      '予約自動リマインド',
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
    id: 'enterprise',
    name: 'Enterprise',
    features: [
      'Proプランの全機能',
      'スタッフ人数無制限',
      '高度な予約分析と統計',
      'カスタマーサポート優先対応',
      'ポイント機能',
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
  },
};

// Staff Auth
// Cookieの名前
export const STAFF_TOKEN_COOKIE = 'bcker_staff_token';
// Cookieの有効期限（日数）
export const COOKIE_EXPIRES_DAYS = 7;
// クライアントサイドでのローカルストレージのキー
export const STAFF_TOKEN_STORAGE_KEY = 'bcker_staff_auth_token';

// UI
export const POINT_EXPIRATION_DAYS = [
  { value: 365, label: '1年' },
  { value: 730, label: '2年' },
  { value: 1095, label: '3年' },
  { value: 1460, label: '4年' },
  { value: 1825, label: '5年' },
];
