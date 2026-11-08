import { Slot } from 'radix-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
export const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 min-h-10 px-4 py-2', {
  variants: { variant: { default: 'bg-primary text-primary-foreground hover:opacity-90', outline: 'border border-input bg-background hover:bg-accent', secondary: 'bg-secondary text-secondary-foreground hover:opacity-90', ghost: 'hover:bg-accent', destructive: 'bg-destructive text-destructive-foreground' } }, defaultVariants: { variant: 'default' },
})
export function Button({ className, variant, asChild = false, type = 'button', ...props }) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp data-slot="button" type={asChild ? undefined : type} className={cn(buttonVariants({ variant }), className)} {...props} />
}
