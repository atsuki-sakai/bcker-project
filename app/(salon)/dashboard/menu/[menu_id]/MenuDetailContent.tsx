// この行を追加: React Hooks の依存関係を修正したファイル
// /components/menu/MenuDetailContent.tsx
'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  CreditCard,
  Clock,
  Tag,
  Users,
  Repeat,
  Edit,
  ChevronDown,
  ChevronUp,
  Trash,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Doc } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { Dialog } from '@/components/common';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { handleErrorToMsg } from '@/lib/error';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convertGender } from '@/services/convex/shared/types/common'

// ラベル定義をコンポーネント外に移動し、再レンダリングの影響を受けないようにする
const labels = {
  gender: {
    all: '全ての性別',
    male: '男性向け',
    female: '女性向け',
  },
  targetType: {
    repeat: 'リピーター向け',
    first: '新規顧客向け',
    all: '全ての顧客向け',
  },
  paymentMethod: {
    credit_card: 'オンライン決済',
    cash: '店舗決済',
    all: '店舗決済・オンライン決済',
  },
}

interface MenuDetailContentProps {
  menu: Doc<'menu'> | null
}

export function MenuDetailContent({ menu }: MenuDetailContentProps) {
  const router = useRouter()
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const deleteMenu = useMutation(api.menu.core.mutation.kill)

  // メモ化によるパフォーマンス最適化
  const formattedPrice = useMemo(() => {
    if (!menu) return ''
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(menu.unitPrice || 0)
  }, [menu])

  const formattedSalePrice = useMemo(() => {
    if (!menu || !menu.salePrice) return null
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(menu.salePrice || 0)
  }, [menu])

  const getTargetTypeLabel = (type: string): string => {
    return labels.targetType[type as keyof typeof labels.targetType] || type
  }

  const getPaymentMethodLabel = (method: string): string => {
    return labels.paymentMethod[method as keyof typeof labels.paymentMethod] || method
  }

  // 説明文の処理
  const shortenedDescription = useMemo(() => {
    if (!menu?.description) return ''
    if (menu.description.length <= 150 || showFullDescription) return menu.description
    return `${menu.description.substring(0, 150)}...`
  }, [menu, showFullDescription])

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription)
  }

  const handleDeleteMenu = async () => {
    if (!menu) {
      toast.error('メニューが見つかりません')
      return
    }

    try {
      await deleteMenu({ menuId: menu._id })
      router.push('/dashboard/menu')
      toast.success('メニューを削除しました')
    } catch (error) {
      toast.error(handleErrorToMsg(error))
    }
  }

  if (!menu) {
    return (
      <div className="space-y-6">
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* アクションボタン */}
      <div className="flex items-center justify-end gap-3">
        <Link href={`/dashboard/menu/${menu._id}/edit`}>
          <Button variant="default" size="sm" className="group">
            <Edit className="w-4 h-4 mr-2" /> 編集
          </Button>
        </Link>

        <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
          <Trash className="w-4 h-4 mr-2" /> 削除
        </Button>
      </div>

      {/* ヘッダー情報 */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* メニュー画像 */}
        <Card className="w-full md:w-1/3 overflow-hidden transition-shadow hover:shadow-md">
          <div className="relative h-64 overflow-hidden">
            {menu.imgPath ? (
              <div className="h-full w-full">
                <Image
                  src={menu.imgPath}
                  alt={menu.name || 'メニュー画像'}
                  className="w-full h-full object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                  loading="eager"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                <Info className="w-8 h-8 mr-2 opacity-30" />
                <span>画像がありません</span>
              </div>
            )}
          </div>
          <CardFooter className="p-4 flex flex-wrap gap-2">
            <Badge
              variant={menu.isActive ? 'default' : 'secondary'}
              className={`transition-all ${menu.isActive ? 'bg-active border-active text-active-foreground' : 'bg-muted border-border text-muted-foreground'}`}
            >
              {menu.isActive ? (
                <>
                  <Eye className="w-3 h-3 mr-1" /> 公開中
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-1" /> 非公開
                </>
              )}
            </Badge>

            {menu.isArchive && (
              <Badge variant="destructive" className="transition-all">
                <Archive className="w-3 h-3 mr-1" /> アーカイブ済み
              </Badge>
            )}
          </CardFooter>
        </Card>

        {/* メニュー情報 */}
        <div className="w-full md:w-2/3">
          <CardHeader className="pb-2">
            {menu.category && (
              <Badge variant={'default'} className="text-xs w-fit px-2 py-1">
                <p>{menu.category}</p>
              </Badge>
            )}
            <CardTitle className="text-2xl font-bold text-primary bg-clip-text py-1">
              {menu.name}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">基本情報</TabsTrigger>
                <TabsTrigger value="details">詳細</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 料金情報 */}
                  <div className="flex items-start p-3 rounded-lg  border border-border">
                    <CreditCard className="w-5 h-5 mt-1 mr-3 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">料金</p>
                      <div className="flex items-baseline">
                        {formattedSalePrice ? (
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-primary">
                              {formattedSalePrice}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {formattedPrice}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-primary">{formattedPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 所要時間 */}
                  <div className="flex items-start p-3 rounded-lg border border-border">
                    <Clock className="w-5 h-5 mt-1 mr-3 text-primary" />
                    <div className="flex flex-row gap-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">実作業時間</p>
                        <p className="text-lg font-medium text-primary">{menu.timeToMin || 0}分</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          トータル施術時間
                        </p>
                        <p className="text-lg font-medium text-primary">
                          {menu.ensureTimeToMin || 0}分
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 対象性別 */}
                  <div className="flex items-start p-3 rounded-lg border border-border">
                    <Users className="w-5 h-5 mt-1 mr-3 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">対象</p>

                      <p className="text-base text-primary">
                        {menu.targetGender && menu.targetGender !== 'unselected'
                          ? convertGender(menu.targetGender as 'unselected' | 'male' | 'female')
                          : '全ての性別'}
                      </p>
                    </div>
                  </div>

                  {/* ターゲット */}
                  <div className="flex items-start p-3 rounded-lg border border-border">
                    <Repeat className="w-5 h-5 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ターゲット</p>
                      <p className="text-base text-primary">
                        {getTargetTypeLabel(menu.targetType || '')}
                      </p>
                    </div>
                  </div>

                  {/* 支払い方法 */}
                  <div className="flex items-start p-3 rounded-lg border border-border">
                    <CreditCard className="w-5 h-5 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">支払い方法</p>
                      <p className="text-base text-primary">
                        {getPaymentMethodLabel(menu.paymentMethod || '')}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                {/* 説明文 */}
                <div className="space-y-2">
                  <h3 className="text-md font-medium text-muted-foreground flex items-center">
                    <Info className="w-4 h-4 mr-2 text-primary" />
                    説明
                  </h3>
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={showFullDescription ? 'full' : 'short'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-primary leading-relaxed"
                      >
                        {shortenedDescription}
                      </motion.p>
                    </AnimatePresence>

                    {menu.description && menu.description.length > 150 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-link-foreground "
                        onClick={toggleDescription}
                      >
                        {showFullDescription ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" /> 省略表示
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" /> もっと見る
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* タグ */}
                <div className="space-y-2">
                  <h3 className="text-md text-muted-foreground flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-primary" />
                    タグ
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {menu.tags && menu.tags.length > 0 ? (
                      menu.tags.map((tag, index) => <Badge key={index}>{tag}</Badge>)
                    ) : (
                      <p className="text-muted-foreground text-sm italic">タグはありません</p>
                    )}
                  </div>
                </div>

                {/* システム情報 */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <h3 className="text-md font-medium text-muted-foreground flex items-center">
                    <Info className="w-4 h-4 mr-2 text-primary" />
                    システム情報
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    <p>作成日時: {new Date(menu._creationTime).toLocaleString('ja-JP')}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog
        title="メニューの削除"
        description="このメニューを削除してもよろしいですか？この操作は元に戻せません。"
        confirmTitle="削除する"
        cancelTitle="キャンセル"
        onConfirmAction={handleDeleteMenu}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  )
}