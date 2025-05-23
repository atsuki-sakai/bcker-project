'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useZodForm } from '@/hooks/useZodForm'
import { UseFormRegister, FieldError } from 'react-hook-form'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { memo } from 'react'
import {
  EyeOffIcon,
  EyeIcon,
  MailIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  InfoIcon,
  Loader2,
} from 'lucide-react'
import { CardDescription, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// メールアドレス変更用のバリデーションスキーマ
const changeEmailSchema = z
  .object({
    newEmail: z
      .string()
      .email('有効なメールアドレスを入力してください')
      .min(1, 'メールアドレスを入力してください'),
    confirmNewEmail: z
      .string()
      .email('有効なメールアドレスを入力してください')
      .min(1, '確認用メールアドレスを入力してください'),
  })
  .refine((data) => data.newEmail === data.confirmNewEmail, {
    message: '新しいメールアドレスと確認用メールアドレスが一致しません',
    path: ['confirmNewEmail'],
  })

// パスワードトグルボタンのコンポーネント（パフォーマンス向上のためmemo化）
const PasswordToggleButton = memo(({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <Button
    variant="ghost"
    size="sm"
    type="button"
    onClick={onToggle}
    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary"
  >
    {show ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
  </Button>
))
PasswordToggleButton.displayName = 'PasswordToggleButton'

// パスワード入力フィールドコンポーネント
const PasswordInput = memo(
  ({
    id,
    label,
    icon,
    placeholder,
    register,
    showPassword,
    togglePassword,
    error,
  }: {
    id: string
    label: string
    icon: React.ReactNode
    placeholder: string
    register: UseFormRegister<z.infer<typeof changeEmailSchema>>
    showPassword: boolean
    togglePassword: () => void
    error: FieldError | undefined
  }) => (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Label htmlFor={id} className="flex items-center text-sm font-medium">
        {icon}
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          className="pr-10 transition-all duration-200"
          {...register(id as keyof z.infer<typeof changeEmailSchema>)}
        />
        <PasswordToggleButton show={showPassword} onToggle={togglePassword} />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-destructive text-xs mt-1 flex items-center"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            {error.message}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
)
PasswordInput.displayName = 'PasswordInput'

// メール入力フィールドコンポーネント
const EmailInput = memo(
  ({
    id,
    label,
    icon,
    placeholder,
    register,
    error,
  }: {
    id: string
    label: string
    icon: React.ReactNode
    placeholder: string
    register: UseFormRegister<z.infer<typeof changeEmailSchema>>
    error: FieldError | undefined
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center text-sm font-medium">
        {icon}
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="email"
          placeholder={placeholder}
          className="transition-all duration-200 "
          {...register(id as keyof z.infer<typeof changeEmailSchema>)}
        />
      </div>
      {error && (
        <p className="text-destructive text-xs mt-1 flex items-center">
          <AlertCircleIcon className="h-3 w-3 mr-1" />
          {error.message}
        </p>
      )}
    </div>
  )
)
EmailInput.displayName = 'EmailInput'

export default function ChangeEmailPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(changeEmailSchema)

  const onSubmit = async (data: z.infer<typeof changeEmailSchema>) => {
    if (!isLoaded || !isSignedIn || !user) {
      toast.error('ユーザー情報の読み込みに失敗しました')
      return
    }

    try {
      // 送信アニメーションのために少し遅延
      await new Promise((resolve) => setTimeout(resolve, 500))
      // 新しいメールアドレスを作成
      try {
        // 新しいメールアドレスを作成
        const emailAddress = await user.createEmailAddress({
          email: data.newEmail,
        })

        // 確認メールを送信
        await emailAddress.prepareVerification({
          strategy: 'email_link',
          redirectUrl: window.location.origin + `/dashboard`,
        })

        toast.success('確認メールを送信しました', {
          description: 'メールを確認して認証を完了してください',
          icon: <MailIcon className="h-4 w-4 text-active" />,
          duration: 6000,
        })

        // 成功メッセージの後に詳細情報を表示
        setTimeout(() => {
          toast.info('メールアドレス管理について', {
            description:
              '新しいメールアドレスの確認後、設定画面から古いメールアドレスを削除するか、新しいアドレスをプライマリーに設定できます',
            icon: <InfoIcon className="h-4 w-4 text-link" />,
            duration: 8000,
          })
          router.push(`/dashboard/setting/email-preferences`)
        }, 4000)
      } catch (error) {
        console.error('Email creation error:', error)
        let errorMessage = 'もう一度お試しください'

        // エラーメッセージの詳細を取得
        console.log(error)
        if (error instanceof Error) {
          // すでに使用されているメールアドレスの場合のエラー処理
          if (error.message.includes('That email address is taken. Please try another.')) {
            errorMessage = 'このメールアドレスはすでに使用されています'
          } else {
            errorMessage = error.message
          }
        }

        toast.error('メールアドレスの追加に失敗しました', {
          description: errorMessage,
          icon: <AlertCircleIcon className="h-4 w-4 text-destructive" />,
        })
      }
    } catch (error) {
      console.error('Overall error:', error)
      toast.error('メールアドレスの更新に失敗しました', {
        description: 'もう一度お試しください',
        icon: <AlertCircleIcon className="h-4 w-4 text-destructive" />,
      })
    }
  }

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="">
        <div className="space-y-1 pb-2">
          <div className="flex items-center justify-center mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 rounded-full bg-secondary">
                    <MailIcon className="h-8 w-8 text-secondary-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>メールアドレスを更新</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardTitle className="text-2xl font-bold text-center">メールアドレス変更</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            新しいメールアドレスを入力してください
          </CardDescription>
        </div>

        <Separator className="my-2 w-1/2 mx-auto" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault()
            }
          }}
        >
          <EmailInput
            id="newEmail"
            label="新しいメールアドレス"
            icon={<MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />}
            placeholder="新しいメールアドレスを入力"
            register={register}
            error={errors.newEmail}
          />

          <EmailInput
            id="confirmNewEmail"
            label="新しいメールアドレス（確認）"
            icon={<ShieldCheckIcon className="h-4 w-4 mr-2 text-muted-foreground" />}
            placeholder="新しいメールアドレスを再入力"
            register={register}
            error={errors.confirmNewEmail}
          />

          <div className="">
            <Button type="submit" className="w-full mt-6" disabled={isSubmitting} variant="default">
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  処理中...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <MailIcon className="h-4 w-4 mr-2" />
                  メールアドレスを更新する
                </span>
              )}
            </Button>
          </div>
        </form>

        <div className="flex flex-col justify-center text-xs text-center text-muted-foreground mt-4">
          <p>確認メールが新しいアドレスに送信されます。クリックして認証を完了してください。</p>
        </div>
      </div>
    </div>
  )
}
