'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import React from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { useZodForm } from '@/hooks/useZodForm';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useSalon } from '@/hooks/useSalon';
// コンポーネントのインポート
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExclusionMenu } from '@/components/common';
import { DashboardSection } from '@/components/common';
import { Label } from '@/components/ui/label';
import {
  CalendarIcon,
  Edit,
  Percent,
  PiggyBank,
  Tag,
  Calendar as CalendarFull,
  Hash,
  AlertCircle,
  Save,
} from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { Id } from '@/convex/_generated/dataModel';
import { handleError } from '@/lib/error';
import { toast } from 'sonner';
import { ZodTextField } from '@/components/common';

const couponSchema = z.object({
  name: z.string().min(1, 'クーポン名を入力してください'),
  couponUid: z
    .string()
    .min(1, 'クーポンUIDを入力してください')
    .max(12, 'クーポンUIDは12文字以内で入力してください')
    .optional(),
  discountType: z.enum(['percentage', 'fixed']),
  percentageDiscountValue: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z
      .number()
      .min(0, { message: '0以上の値を入力してください' })
      .max(100, { message: '割引率は100%以下で入力してください' })
      .optional()
  ),
  fixedDiscountValue: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z
      .number()
      .min(0, { message: '0以上の値を入力してください' })
      .max(99999, { message: '割引額は99999円以下で入力してください' })
      .optional()
  ),
  isActive: z.boolean(),
  startDate: z.date(),
  endDate: z
    .date()
    .refine((date) => date > new Date(), { message: '終了日は現在より後の日付を選択してください' }),
  maxUseCount: z.number().min(0, '0以上の値を入力してください'),
  numberOfUse: z.number().min(0, '0以上の値を入力してください'),
  selectedMenus: z.array(z.string()).optional(),
});

// アニメーション定義
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

interface PageProps {
  params: Promise<{ coupon_id: Id<'coupon'> }>;
}
// ページコンポーネント
export default function Page({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const { coupon_id } = unwrappedParams;
  return (
    <DashboardSection
      title="クーポンを編集"
      backLink="/dashboard/coupon"
      backLinkTitle="クーポン一覧へ戻る"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">クーポン情報を編集して保存できます。</p>
          <Separator className="my-2" />
        </div>

        <CouponForm couponId={coupon_id} />
      </motion.div>
    </DashboardSection>
  );
}

// クーポンプレビューコンポーネント
function CouponPreview({ data }: { data: z.infer<typeof couponSchema> }) {
  const formatDate = (date: Date | undefined) => {
    if (!date) return '未設定';
    try {
      return format(date, 'yyyy/MM/dd', { locale: ja });
    } catch {
      return '無効な日付';
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-md overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-purple-600">
          <CardTitle className="text-white flex items-center gap-2">
            <Tag size={18} />
            {data.name || 'クーポン名'}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {data.isActive ? '有効なクーポン' : '無効なクーポン'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <Badge variant="outline" className="px-3 py-1 text-lg font-bold bg-white">
                {data.discountType === 'percentage'
                  ? `${data.percentageDiscountValue || 0}% OFF`
                  : `¥${data.fixedDiscountValue || 0} OFF`}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div className="flex items-center gap-1 text-gray-600">
                <CalendarFull size={14} />
                <span>開始日:</span>
              </div>
              <div className="text-right">{formatDate(data.startDate)}</div>

              <div className="flex items-center gap-1 text-gray-600">
                <CalendarFull size={14} />
                <span>終了日:</span>
              </div>
              <div className="text-right">{formatDate(data.endDate)}</div>

              <div className="flex items-center gap-1 text-gray-600">
                <Hash size={14} />
                <span>利用回数:</span>
              </div>
              <div className="text-right ">
                <span className="text-sm">
                  {isNaN(data.numberOfUse) ? 0 : data.numberOfUse || 0}
                </span>
                <span className="text-xs text-gray-500">
                  / {isNaN(data.maxUseCount) ? '無制限' : data.maxUseCount || '無制限'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 pt-2 pb-2 flex justify-between">
          <div className="text-xs text-gray-500">
            クーポン適用外メニュー: {data.selectedMenus?.length || 0}件
          </div>
          <Badge variant={data.isActive ? 'default' : 'destructive'} className="h-6">
            {data.isActive ? '有効' : '無効'}
          </Badge>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// メインのフォームコンポーネント
function CouponForm({ couponId }: { couponId: Id<'coupon'> }) {
  const router = useRouter();
  const { salon } = useSalon();
  // 状態管理
  const [selectedMenuIds, setSelectedMenuIds] = useState<Id<'menu'>[]>([]);
  const [initialSelectedMenuIds, setInitialSelectedMenuIds] = useState<Id<'menu'>[]>([]);
  // Convex
  const updateCouponComplete = useMutation(api.coupon.core.mutation.updateCouponRelatedTables);
  const couponCompleteData = useQuery(
    api.coupon.core.query.findCouponComplete,
    salon?._id
      ? {
          couponId: couponId as Id<'coupon'>,
          salonId: salon?._id as Id<'salon'>,
        }
      : 'skip'
  );

  const { coupon, couponConfig, couponExclusionMenus } = couponCompleteData ?? {};
  // フォーム管理
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting, errors, isDirty },
  } = useZodForm(couponSchema);

  // フォームの値を監視
  const formValues = watch();
  const discountType = watch('discountType');

  // フォーム送信ハンドラー
  const onSubmit = async (data: z.infer<typeof couponSchema>) => {
    // 選択されたメニューIDsを追加
    const submitData = {
      ...data,
    };

    try {
      if (!salon) {
        toast.error('サロンが存在しません');
        return;
      }
      if (!couponConfig) {
        throw new Error('クーポン設定が存在しません');
      }
      await updateCouponComplete({
        salonId: salon._id as Id<'salon'>,
        couponId: couponId,
        couponConfigId: couponConfig._id,
        couponUid: submitData.couponUid,
        name: submitData.name,
        discountType: submitData.discountType,
        percentageDiscountValue:
          submitData.percentageDiscountValue !== undefined ? submitData.percentageDiscountValue : 0,
        fixedDiscountValue:
          submitData.fixedDiscountValue !== undefined ? submitData.fixedDiscountValue : 0,
        isActive: submitData.isActive,
        startDate_unix: submitData.startDate.getTime(),
        endDate_unix: submitData.endDate.getTime(),
        maxUseCount: submitData.maxUseCount,
        numberOfUse: submitData.numberOfUse,
        selectedMenuIds: selectedMenuIds,
      });
      toast.success('クーポンを更新しました');
      router.push(`/dashboard/coupon`);
    } catch (e) {
      const { message: errorMessage } = handleError(e);
      toast.error(errorMessage);
    }
  };

  // 初期データの設定
  useEffect(() => {
    if (coupon && couponConfig) {
      reset({
        name: coupon.name,
        couponUid: coupon.couponUid,
        discountType: (coupon.discountType as 'percentage' | 'fixed') ?? 'percentage',
        percentageDiscountValue: coupon.percentageDiscountValue ?? 0,
        fixedDiscountValue: coupon.fixedDiscountValue ?? 0,
        isActive: coupon.isActive,
        startDate: new Date(couponConfig.startDate_unix ?? Date.now()),
        endDate: new Date(couponConfig.endDate_unix ?? Date.now()),
        maxUseCount: couponConfig.maxUseCount ?? 0,
        numberOfUse: couponConfig.numberOfUse ?? 0,
      });
    }
    const initialIds = couponExclusionMenus?.map((menu) => menu.menuId) ?? [];
    setSelectedMenuIds(initialIds);
    setInitialSelectedMenuIds(initialIds);
  }, [reset, coupon, couponConfig, couponExclusionMenus]);

  // 表示用のプレビューデータ
  const previewData = {
    ...formValues,
    selectedMenus: selectedMenuIds,
  };

  // 配列の内容が変更されたか比較
  const menuIdsChanged =
    JSON.stringify(selectedMenuIds.sort()) !== JSON.stringify(initialSelectedMenuIds.sort());

  console.log('Form Errors:', errors);
  console.log('Is Submitting:', isSubmitting);
  console.log('Is Dirty:', isDirty);
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Tabs defaultValue="preview" className="md:col-span-2">
          <TabsList>
            <TabsTrigger value="preview">基本設定</TabsTrigger>
            <TabsTrigger value="detail">除外メニュー設定</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            {/* フォーム入力部分 */}
            <div className="md:col-span-3 space-y-6">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="flex flex-col gap-6 bg-white rounded-lg p-6 shadow-sm border"
              >
                <div className="space-y-4 py-2">
                  <ZodTextField
                    register={register}
                    errors={errors}
                    name="name"
                    label="クーポン名"
                    icon={<Tag size={16} />}
                    placeholder="例: 初回限定20%OFF"
                  />
                  <ZodTextField
                    register={register}
                    errors={errors}
                    name="couponUid"
                    label="クーポンコード"
                    icon={<Hash size={16} />}
                    placeholder="例: COUPON-00123"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-gray-700">
                        <Percent size={16} />
                        割引タイプ
                      </Label>
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                        <div
                          className={`flex-1 text-center p-2 rounded-md ${discountType === 'percentage' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500'}`}
                        >
                          割引率
                        </div>
                        <Controller
                          control={control}
                          name="discountType"
                          render={({ field }) => (
                            <Switch
                              checked={field.value === 'fixed'}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? 'fixed' : 'percentage');
                              }}
                              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-blue-600"
                            />
                          )}
                        />
                        <div
                          className={`flex-1 text-center p-2 rounded-md ${discountType === 'fixed' ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500'}`}
                        >
                          固定金額
                        </div>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {discountType === 'percentage' ? (
                        <motion.div
                          key="percentage"
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={fadeIn}
                        >
                          <ZodTextField
                            register={register}
                            errors={errors}
                            name="percentageDiscountValue"
                            label="割引率 (%)"
                            type="number"
                            icon={<Percent size={16} />}
                            placeholder="例: 10"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="fixed"
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={fadeIn}
                        >
                          <ZodTextField
                            register={register}
                            errors={errors}
                            name="fixedDiscountValue"
                            label="固定割引額 (円)"
                            type="number"
                            icon={<PiggyBank size={16} />}
                            placeholder="例: 1000"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-gray-700">
                        <CalendarIcon size={16} />
                        開始日
                      </Label>
                      <Controller
                        control={control}
                        name="startDate"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${
                                  errors.startDate ? 'border-red-500' : ''
                                }`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, 'yyyy年MM月dd日', { locale: ja })
                                ) : (
                                  <span>日付を選択</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                locale={ja}
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {errors.startDate && (
                        <motion.p
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={fadeIn}
                          className="mt-1 text-sm text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle size={14} />
                          {errors.startDate?.message}
                        </motion.p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-gray-700">
                        <CalendarIcon size={16} />
                        終了日
                      </Label>
                      <Controller
                        control={control}
                        name="endDate"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${
                                  errors.endDate ? 'border-red-500' : ''
                                }`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, 'yyyy年MM月dd日', { locale: ja })
                                ) : (
                                  <span>日付を選択</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                locale={ja}
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {errors.endDate && (
                        <motion.p
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={fadeIn}
                          className="mt-1 text-sm text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle size={14} />
                          {errors.endDate?.message}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2 text-gray-700">
                        現在の利用回数
                      </Label>
                      <p className="text-sm">
                        <span className="text-sm">
                          {isNaN(formValues.numberOfUse) ? 0 : formValues.numberOfUse || 0}
                        </span>{' '}
                        /
                        <span className="text-xs text-gray-500">
                          {isNaN(formValues.maxUseCount)
                            ? '無制限'
                            : formValues.maxUseCount || '無制限'}
                        </span>
                      </p>
                    </div>
                    <ZodTextField
                      register={register}
                      errors={errors}
                      name="maxUseCount"
                      label="最大利用回数"
                      type="number"
                      icon={<Hash size={16} />}
                      placeholder="例: 100"
                    />
                  </div>
                </div>

                <div className="space-y-4 py-2">
                  <div className="flex flex-col gap-2 pt-2">
                    <Controller
                      control={control}
                      name="isActive"
                      render={({ field }) => (
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="isActive"
                            className="flex items-center gap-2 text-gray-700 cursor-pointer"
                          >
                            クーポンの有効/無効
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{field.value ? '有効' : '無効'}</span>
                            <Switch
                              id="isActive"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>
          <TabsContent value="detail">
            <ExclusionMenu
              title="適用しないメニュー"
              selectedMenuIds={selectedMenuIds}
              setSelectedMenuIdsAction={(menuIds: Id<'menu'>[]) => setSelectedMenuIds(menuIds)}
            />
          </TabsContent>
        </Tabs>
        {/* プレビュー部分 */}
        <div className="md:col-span-1">
          <div className="sticky top-4 space-y-4">
            <motion.h3
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-lg font-medium flex items-center gap-2"
            >
              <Edit size={18} />
              クーポンプレビュー
            </motion.h3>

            <CouponPreview data={previewData} />

            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mt-6">
              <Button
                type="submit"
                disabled={isSubmitting || !(isDirty || menuIdsChanged)}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </motion.div>
                    追加中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    クーポンを更新
                  </>
                )}
              </Button>

              {isDirty && (
                <p className="text-xs text-center mt-2 text-gray-500">
                  変更があります。保存を忘れずに。
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </form>
  );
}