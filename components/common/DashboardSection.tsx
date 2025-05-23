import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
interface SectionContainerProps {
  children: React.ReactNode
  title?: string
  backLink: string
  backLinkTitle: string
  infoBtn?: {
    text: string
    link: string
  }
  subBtn?: {
    text: string
    link: string
  }
}

export default function DashboardSection({
  children,
  title,
  backLink,
  backLinkTitle,
  infoBtn,
  subBtn,
}: SectionContainerProps) {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center">
        {title ? (
          <div className=" flex flex-col w-full mb-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <Link href={backLink} className="group">
                <span className="text-xs md:text-sm text-muted-foreground flex items-center gap-2 hover:underline">
                  <span>{backLinkTitle}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-primary">{title}</h1>
          </div>
        ) : (
          <div className="flex flex-col w-full mb-2 z-10">
            <Link href={backLink} className="group">
              <span className="text-xs md:text-sm text-muted-foreground flex items-center gap-2 hover:underline">
                <span>{backLinkTitle}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-2">
          {infoBtn && (
            <Button asChild className="text-xs md:text-sm">
              <Link href={infoBtn.link}>{infoBtn.text}</Link>
            </Button>
          )}
          {subBtn && (
            <Button asChild className="text-xs md:text-sm">
              <Link href={subBtn.link}>{subBtn.text}</Link>
            </Button>
          )}
        </div>
      </div>
      <div className="mb-24 max-w-[100vw]">{children}</div>
    </div>
  )
}
