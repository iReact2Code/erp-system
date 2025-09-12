import React from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: (id: string) => void
}

const toastVariants = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
}

export function Toast({
  id,
  title,
  description,
  type = 'info',
  onClose,
}: ToastProps) {
  const Icon = toastIcons[type]

  return (
    <div
      className={cn(
        'relative flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-top-2',
        toastVariants[type]
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      {onClose && (
        <button
          onClick={() => onClose(id)}
          className="absolute top-2 right-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export { Toast as default }
