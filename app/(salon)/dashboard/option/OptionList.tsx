'use client';

import { useState } from 'react';
import { useStablePaginatedQuery } from '@/hooks/useStablePaginatedQuery';
import { api } from '@/convex/_generated/api';
import { useSalon } from '@/hooks/useSalon';
import Link from 'next/link';
import { Loading, Dialog } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { handleError } from '@/lib/error';

const numberOfItems = 10;
export default function OptionList() {
  const { salon } = useSalon();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteOptionId, setDeleteOptionId] = useState<Id<'salon_option'> | null>(null);
  const {
    results: options,
    loadMore,
    isLoading,
    status,
  } = useStablePaginatedQuery(
    api.option.query.list,
    salon?._id
      ? {
          salonId: salon._id,
          activeOnly: true,
        }
      : 'skip',
    {
      initialNumItems: numberOfItems,
    }
  );

  const killOption = useMutation(api.option.mutation.kill);

  const showDeleteDialog = (optionId: Id<'salon_option'>) => {
    setIsDialogOpen(true);
    setDeleteOptionId(optionId);
  };

  const handleDelete = (optionId: Id<'salon_option'>) => {
    try {
      killOption({
        optionId,
      });
      toast.success('オプションを削除しました');
      setIsDialogOpen(false);
    } catch (error) {
      const errorDetails = handleError(error);
      toast.error(errorDetails.message);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden ring-1 shadow-sm ring-black/5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    ステータス
                  </th>
                  <th
                    scope="col"
                    className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    メニュー名
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    単価/セール価格
                  </th>

                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    最大注文数
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    施術時間
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    タグ
                  </th>
                  <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
                    <span className="sr-only">編集</span>
                  </th>
                  <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
                    <span className="sr-only">削除</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {options && options.length > 0 ? (
                  options.map((option: Doc<'salon_option'>) => (
                    <tr key={option._id}>
                      <td
                        className={`py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 `}
                      >
                        <span
                          className={`font-bold text-xs ${option.isActive ? 'bg-green-600' : 'bg-gray-400'} text-white px-2 py-1 rounded-md`}
                        >
                          {option.isActive ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6">
                        {option.name}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {option.salePrice ? (
                          <span className="line-through text-gray-500 text-xs">
                            ¥{option.unitPrice?.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700">
                            ¥{option.unitPrice?.toLocaleString()}
                          </span>
                        )}
                        {option.salePrice ? (
                          <span className="text-sm text-gray-700">
                            / ¥{option.salePrice.toLocaleString()}
                          </span>
                        ) : (
                          ''
                        )}
                      </td>

                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {option.orderLimit ? `${option.orderLimit}個` : '未設定'}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {option.timeToMin ? `${option.timeToMin}分` : '未設定'}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {option.tags && option.tags.length > 0 ? option.tags.join(', ') : '未設定'}
                      </td>
                      <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                        <Link
                          href={`/dashboard/option/${option._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          編集<span className="sr-only">, {option.name}</span>
                        </Link>
                      </td>
                      <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                        <Button
                          variant="ghost"
                          onClick={() => showDeleteDialog(option._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除<span className="sr-only">, {option.name}</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-sm text-gray-500">
                      オプションがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {options && options.length > 0 && status == 'CanLoadMore' && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => loadMore(numberOfItems)}>
            オプションをさらに読み込む
          </Button>
        </div>
      )}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="オプションを削除しますか？"
        description="この操作は元に戻すことができません。"
        onConfirmAction={() => handleDelete(deleteOptionId!)}
      />
    </div>
  );
}
