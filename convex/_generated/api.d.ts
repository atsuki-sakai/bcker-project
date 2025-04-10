/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as carte_core from "../carte/core.js";
import type * as carte_detail from "../carte/detail.js";
import type * as constants from "../constants.js";
import type * as coupon_config from "../coupon/config.js";
import type * as coupon_core from "../coupon/core.js";
import type * as coupon_coupon_exclusion_menu from "../coupon/coupon_exclusion_menu.js";
import type * as coupon_transaction from "../coupon/transaction.js";
import type * as customer_core from "../customer/core.js";
import type * as customer_detail from "../customer/detail.js";
import type * as customer_points from "../customer/points.js";
import type * as menu_core from "../menu/core.js";
import type * as menu_menu_exclusion_staff from "../menu/menu_exclusion_staff.js";
import type * as migrations from "../migrations.js";
import type * as option_core from "../option/core.js";
import type * as point_auth from "../point/auth.js";
import type * as point_config from "../point/config.js";
import type * as point_exclusion_menu from "../point/exclusion_menu.js";
import type * as point_task_queue from "../point/task_queue.js";
import type * as point_transaction from "../point/transaction.js";
import type * as reservation_core from "../reservation/core.js";
import type * as salon_api_config from "../salon/api_config.js";
import type * as salon_config from "../salon/config.js";
import type * as salon_core from "../salon/core.js";
import type * as salon_schedule_config from "../salon/schedule_config.js";
import type * as salon_stripe from "../salon/stripe.js";
import type * as schedule_salon_schedule_exception from "../schedule/salon_schedule_exception.js";
import type * as schedule_salon_week_schedule from "../schedule/salon_week_schedule.js";
import type * as schedule_staff_schedule_exception from "../schedule/staff_schedule_exception.js";
import type * as schedule_staff_week_schedule from "../schedule/staff_week_schedule.js";
import type * as shared_types_common from "../shared/types/common.js";
import type * as shared_utils_auth from "../shared/utils/auth.js";
import type * as shared_utils_error from "../shared/utils/error.js";
import type * as shared_utils_helper from "../shared/utils/helper.js";
import type * as shared_utils_validation from "../shared/utils/validation.js";
import type * as staff_auth from "../staff/auth.js";
import type * as staff_config from "../staff/config.js";
import type * as staff_core from "../staff/core.js";
import type * as staff_time_card from "../staff/time_card.js";
import type * as storage_core from "../storage/core.js";
import type * as subscription_core from "../subscription/core.js";
import type * as subscription_stripe from "../subscription/stripe.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "carte/core": typeof carte_core;
  "carte/detail": typeof carte_detail;
  constants: typeof constants;
  "coupon/config": typeof coupon_config;
  "coupon/core": typeof coupon_core;
  "coupon/coupon_exclusion_menu": typeof coupon_coupon_exclusion_menu;
  "coupon/transaction": typeof coupon_transaction;
  "customer/core": typeof customer_core;
  "customer/detail": typeof customer_detail;
  "customer/points": typeof customer_points;
  "menu/core": typeof menu_core;
  "menu/menu_exclusion_staff": typeof menu_menu_exclusion_staff;
  migrations: typeof migrations;
  "option/core": typeof option_core;
  "point/auth": typeof point_auth;
  "point/config": typeof point_config;
  "point/exclusion_menu": typeof point_exclusion_menu;
  "point/task_queue": typeof point_task_queue;
  "point/transaction": typeof point_transaction;
  "reservation/core": typeof reservation_core;
  "salon/api_config": typeof salon_api_config;
  "salon/config": typeof salon_config;
  "salon/core": typeof salon_core;
  "salon/schedule_config": typeof salon_schedule_config;
  "salon/stripe": typeof salon_stripe;
  "schedule/salon_schedule_exception": typeof schedule_salon_schedule_exception;
  "schedule/salon_week_schedule": typeof schedule_salon_week_schedule;
  "schedule/staff_schedule_exception": typeof schedule_staff_schedule_exception;
  "schedule/staff_week_schedule": typeof schedule_staff_week_schedule;
  "shared/types/common": typeof shared_types_common;
  "shared/utils/auth": typeof shared_utils_auth;
  "shared/utils/error": typeof shared_utils_error;
  "shared/utils/helper": typeof shared_utils_helper;
  "shared/utils/validation": typeof shared_utils_validation;
  "staff/auth": typeof staff_auth;
  "staff/config": typeof staff_config;
  "staff/core": typeof staff_core;
  "staff/time_card": typeof staff_time_card;
  "storage/core": typeof storage_core;
  "subscription/core": typeof subscription_core;
  "subscription/stripe": typeof subscription_stripe;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
    public: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; migrationNames?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      runMigration: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
