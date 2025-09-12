'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, ToastProps } from '@/components/ui/toast'

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: removeToast,
      }

      setToasts(prev => [...prev, newToast])

      // Auto remove after duration
      const duration = toast.duration || 5000
      setTimeout(() => {
        removeToast(id)
      }, duration)
    },
    [removeToast]
  )

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: 'success' })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: 'error' })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: 'info' })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: 'warning' })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
      }}
    >
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
