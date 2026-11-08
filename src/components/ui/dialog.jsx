import { Dialog as Primitive } from 'radix-ui'
import { cn } from '@/lib/utils'
export const Dialog = Primitive.Root
export const DialogTitle = Primitive.Title
export const DialogDescription = Primitive.Description
export function DialogContent({ className, children, withCloseButton = true, ...props }) {
  return <Primitive.Portal><Primitive.Overlay className="fixed inset-0 z-50 bg-black/60" /><Primitive.Content className={cn('fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg max-h-[90dvh] overflow-y-auto', className)} {...props}>{children}{withCloseButton && <Primitive.Close className="absolute right-3 top-2 rounded p-2 focus-visible:ring-2" aria-label="Close dialog">×</Primitive.Close>}</Primitive.Content></Primitive.Portal>
}
