import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Stripe from "stripe";
import { BillingPeriod } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 指数バックオフで再試行を行う関数
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 500
): Promise<T> {
  let retries = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        console.error(`最大${maxRetries}回の再試行後、処理に失敗しました:`, error);
        throw error;
      }
      // 指数バックオフ + ランダム要素（ジッター）を適用
      const exponentialDelay = Math.min(5000, Math.pow(2, retries - 1) * baseDelay);
      // ジッター適用後に最小1秒、最大5秒の範囲に収める
      const jitter = Math.random();
      // 1000ms〜exponentialDelayの範囲になるよう調整
      const delay = Math.max(1000, Math.floor(exponentialDelay * jitter));

      console.log(`処理を ${delay}ms 後に再試行します (試行回数: ${retries}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export function timestampToJSTISO(timestamp: number) {
  const date = new Date(timestamp);
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const year  = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day   = parts.find(p => p.type === 'day')?.value;
  const hour  = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
}

// Stripeのサブスクリプションステータスを正規化する関数
export function normalizeSubscriptionStatus(subscription: Stripe.Subscription): string {
  const { status } = subscription;

  // Status handling for business logic
  switch (status) {
    // Treat as active: make sure these are considered valid subscriptions
    case "incomplete":
    case "trialing":
      return "active";
    
    // Handle payment issues
    case "past_due":      // 支払い期限切れ
    case "unpaid":        // 未払い
      console.log(`支払い問題を検出: サブスクリプション ${subscription.id} は ${status} 状態です`);
      // ここでは "payment_issue" として返すことも可能
      return status; 
    
    // Other standard states
    case "active":
    case "canceled":
    case "incomplete_expired":
      return status;
      
    // Fallback for unknown/future states
    default:
      console.warn(`未知のサブスクリプションステータス: ${status}, ID: ${subscription.id}`);
      return status;
  }
}


// Stripeの課金期間をConvexの課金期間に変換
export function priceIdToPlanInfo(priceId: string) {

  switch (priceId) {
    case process.env.NEXT_PUBLIC_LITE_MONTHLY_PRC_ID:
      return {
        name: "Lite",
        price: 6000,
      };
    case process.env.NEXT_PUBLIC_LITE_YEARLY_PRC_ID:
      return {
        name: "Lite",
        price: 50000,
      };
    case process.env.NEXT_PUBLIC_PRO_MONTHLY_PRC_ID:
      return {
        name: "Pro",
        price: 10000,
      };
    case process.env.NEXT_PUBLIC_PRO_YEARLY_PRC_ID:
      return {
        name: "Pro",
        price: 100000,
      };
    case process.env.NEXT_PUBLIC_ENTRPIS_MONTHLY_PRC_ID:
      return {
        name: "Enterprise",
        price: 16000,
      };
    case process.env.NEXT_PUBLIC_ENTRPIS_YEARLY_PRC_ID:
      return {
        name: "Enterprise",
        price: 153600,
      };
    default:
      return new Error("Invalid priceId");
  }
}

// プランと課金期間から価格IDを取得する関数
export function getPriceStrFromPlanAndPeriod(planStr: string, period: BillingPeriod): string {
  planStr = planStr.toLowerCase();
  if (period === "monthly") {
    switch (planStr) {
      case "lite":
        return process.env.NEXT_PUBLIC_LITE_MONTHLY_PRC_ID!;
      case "pro":
        return process.env.NEXT_PUBLIC_PRO_MONTHLY_PRC_ID!;
      case "enterprise":
        return process.env.NEXT_PUBLIC_ENTRPIS_MONTHLY_PRC_ID!;
      default:
        throw new Error("Invalid plan ID");
    }
  } else {
    switch (planStr) {
      case "lite":
        return process.env.NEXT_PUBLIC_LITE_YEARLY_PRC_ID!;
      case "pro":
        return process.env.NEXT_PUBLIC_PRO_YEARLY_PRC_ID!;
      case "enterprise":
        return process.env.NEXT_PUBLIC_ENTRPIS_YEARLY_PRC_ID!;
      default:
        throw new Error("Invalid plan ID");
    }
  }
}

// ファイルをBase64に変換する関数
export async function fileToBase64(file: File): Promise<string> {
  const base64Promise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // data:image/jpeg;base64,の部分を除去
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });

  return base64Promise;
}
