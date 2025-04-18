'use client';

import Image from 'next/image';
import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useSalon } from '@/hooks/useSalon';
import { Loading } from '@/components/common';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Dialog } from '@/components/common';
import Link from 'next/link';
// Shadcn UI コンポーネント
import { Card, CardContent, CardFooter } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { handleError } from '@/lib/error';
import { decryptString } from '@/lib/utils';

// アイコン
import {
  User,
  Trash,
  Star,
  Tag,
  Mail,
  Calendar,
  Info,
  FileEdit,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MAX_PRIORITY } from '@/services/convex/constants';

// アニメーション設定
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      duration: 0.5,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function StaffDetails() {
  const { staff_id } = useParams();
  const { salon } = useSalon();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [decryptedPinCode, setDecryptedPinCode] = useState('');
  const [showPinCode, setShowPinCode] = useState(false);

  // メモ化されたクエリを使用してパフォーマンス向上
  const staffAllData = useQuery(
    api.staff.core.query.getRelatedTables,
    salon?._id && staff_id && !isDeleting
      ? { salonId: salon?._id, staffId: staff_id as Id<'staff'> }
      : 'skip'
  );

  const exclusionMenus = useQuery(
    api.menu.menu_exclusion_staff.query.listBySalonAndStaffId,
    salon?._id
      ? {
          salonId: salon?._id,
          staffId: staff_id as Id<'staff'>,
        }
      : 'skip'
  );

  const staffKill = useMutation(api.staff.core.mutation.killRelatedTables);
  const deleteImage = useAction(api.storage.action.kill);

  useEffect(() => {
    const asyncDecryptPinCode = async () => {
      if (staffAllData?.pinCode) {
        setDecryptedPinCode(
          await decryptString(staffAllData.pinCode, process.env.NEXT_PUBLIC_ENCRYPTION_SECRET_KEY!)
        );
      }
    };
    asyncDecryptPinCode();
  }, [staffAllData]);

  if (!staffAllData) return <Loading />;

  // アバターの頭文字を取得
  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'ST';
  };

  // 性別を日本語で表示
  const getGenderText = (gender: string) => {
    return gender === 'male' ? '男性' : gender === 'female' ? '女性' : '未選択';
  };

  // roleをわかりやすい表示に変換
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'staff':
        return 'スタッフ権限';
      case 'manager':
        return 'マネージャー権限';
      case 'owner':
        return 'オーナー権限';
      default:
        return role;
    }
  };

  const handleShowPinCode = () => {
    setShowPinCode(!showPinCode);
  };

  const handleShowDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStaff = async () => {
    try {
      // 削除処理中フラグを立てて、クエリの実行を停止
      setIsDeleting(true);

      if (staffAllData?.imgPath) {
        await deleteImage({
          imgUrl: staffAllData.imgPath,
        });
      }
      if (staffAllData) {
        await staffKill({
          staffId: staff_id as Id<'staff'>,
          staffConfigId: staffAllData.staffConfigId,
          staffAuthId: staffAllData.staffAuthId,
        });
      }
      toast.success('スタッフを削除しました');
      router.push('/dashboard/staff');
    } catch (error) {
      // エラーが発生した場合は削除処理中フラグを元に戻す
      setIsDeleting(false);
      const errorDetails = handleError(error);
      toast.error(errorDetails.message);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="pb-8">
      {/* スタッフヘッダーカード - 改良版 */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6 border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* サムネイル部分 - スタイル改良 */}
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex items-center justify-center md:w-1/3">
                <div className="aspect-square flex items-center justify-center w-48 h-48 mx-auto overflow-hidden">
                  {staffAllData.imgPath ? (
                    <Image
                      src={staffAllData.imgPath}
                      alt={staffAllData.name || ''}
                      width={280}
                      height={280}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-3xl font-semibold text-primary/70 flex items-center justify-center h-full w-full">
                      {getInitials(staffAllData.name || '')}
                    </div>
                  )}
                </div>
              </div>

              {/* 情報部分 - レイアウト改良 */}
              <div className="p-6 md:w-2/3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{staffAllData.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge
                        variant={staffAllData.isActive ? 'outline' : 'destructive'}
                        className={`transition-all duration-300 ${
                          staffAllData.isActive
                            ? 'border-green-500 text-green-600 hover:border-green-700'
                            : 'border-red-500 text-red-600 hover:border-red-700'
                        }`}
                      >
                        {staffAllData.isActive ? 'アクティブ' : '非アクティブ'}
                      </Badge>
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        {getRoleDisplay(staffAllData.role || '')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span>{getGenderText(staffAllData.gender || '未選択')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>{staffAllData.age ? `${staffAllData.age}歳` : '年齢未設定'}</span>
                    </div>
                  </div>
                </div>

                <span className="text-xs text-slate-500">スタッフ紹介</span>
                <p className=" text-slate-600  mb-5  border-slate-100">
                  {staffAllData.description || '説明がありません'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {/* 指名料金 */}
                  <div className="flex justify-between bg-gradient-to-br from-purple-50 to-white p-3 rounded-lg border border-purple-100 transition-shadow">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Tag className="h-4 w-4" />
                        <p className="text-xs font-medium">指名料金</p>
                      </div>
                      <p className="font-bold text-lg text-purple-900">
                        ¥{staffAllData.extraCharge || 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-xs">
                        指名料金は予約時のサービス料金に影響します。
                      </p>
                    </div>
                  </div>

                  {/* 優先度 */}
                  <div className="flex justify-between bg-gradient-to-br from-amber-50 to-white p-3 rounded-lg border border-amber-100 transition-shadow">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Star className="h-4 w-4" />
                        <p className="text-xs font-medium">優先度</p>
                      </div>
                      <p className="font-bold text-lg text-amber-900">
                        {staffAllData.priority || 0}
                        <span className="text-xs text-muted-foreground">/{MAX_PRIORITY}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-xs">
                        数値が大きいほど予約画面などで上位に表示されます。
                      </p>
                    </div>
                  </div>

                  {/* メールアドレス */}
                  <div className="flex justify-between bg-gradient-to-br from-blue-50 to-white p-3 rounded-lg border border-blue-100 transition-shadow">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Mail className="h-4 w-4" />
                        <p className="text-xs font-medium">メールアドレス</p>
                      </div>
                      <p className="font-bold text-sm text-blue-900 truncate max-w-[180px]">
                        {staffAllData.email || '未設定'}
                      </p>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs scale-75 -ml-6 text-slate-500">ピンコード</p>
                        <div className="flex items-center -mt-3">
                          <p className="text-slate-500 text-sm w-20 tracking-wider font-bold">
                            {showPinCode ? decryptedPinCode : '*** ***'}
                          </p>

                          <Button
                            variant="outline"
                            size="icon"
                            className="ml-4 scale-75"
                            onClick={handleShowPinCode}
                          >
                            {showPinCode ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className=" scale-75"
                            onClick={() => {
                              navigator.clipboard.writeText(decryptedPinCode);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-blue-400 self-start cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs max-w-xs">
                            メールアドレスやピンコードはスタッフのログインに使用されます
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* 対応外メニュー表示 */}
                {exclusionMenus && exclusionMenus.length > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-md border border-orange-100">
                    <h3 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      対応外メニュー
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {exclusionMenus.map((menu) => (
                        <li
                          key={menu.menuId.slice(0, 12)}
                          className="bg-white border border-orange-200 p-1 px-2 text-xs text-orange-700 rounded-md shadow-sm"
                        >
                          {menu.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50 px-6 py-3 flex justify-between">
            <div className="text-xs text-slate-500 tracking-wider">
              <span>作成日: </span>
              {new Date(staffAllData._creationTime).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={handleShowDeleteDialog}
              >
                <Trash className="h-4 w-4" />
                削除
              </Button>
              <Link href={`/dashboard/staff/${staff_id}/edit`}>
                <Button variant="default" size="sm" className="gap-1">
                  <FileEdit className="h-4 w-4" />
                  編集
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="スタッフを削除しますか？"
        description="この操作は元に戻すことができません。"
        onConfirmAction={handleDeleteStaff}
      />
    </motion.div>
  );
}