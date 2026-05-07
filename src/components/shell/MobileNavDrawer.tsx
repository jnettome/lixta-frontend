import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MobileNavDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function MobileNavDrawer({ open, onOpenChange, children }: MobileNavDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]',
            'transition-opacity duration-200 ease-out data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col border-r border-border bg-surface-1 shadow-2xl outline-none',
            'transition-transform duration-200 ease-out will-change-transform',
            'data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">Main navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Workspace navigation, signals, tasks, and account
          </Dialog.Description>
          <div className="flex shrink-0 justify-end border-b border-border p-2">
            <Dialog.Close
              type="button"
              className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
