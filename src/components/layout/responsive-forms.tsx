'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useResponsive, touchFriendly } from '@/lib/responsive-utils'
import { cn } from '@/lib/utils'

interface ResponsiveFormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  description?: string
}

const ResponsiveFormField: React.FC<ResponsiveFormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  description,
}) => {
  const { isMobile } = useResponsive()

  return (
    <div className="space-y-2">
      <Label className={cn('font-medium', isMobile ? 'text-sm' : 'text-sm')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {description && (
        <p
          className={cn(
            'text-muted-foreground',
            isMobile ? 'text-xs' : 'text-sm'
          )}
        >
          {description}
        </p>
      )}
      <div className={cn(isMobile && touchFriendly.input)}>{children}</div>
      {error && (
        <p className={cn('text-red-500', isMobile ? 'text-xs' : 'text-sm')}>
          {error}
        </p>
      )}
    </div>
  )
}

interface ResponsiveInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  required?: boolean
  error?: string
  description?: string
}

const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  label,
  required = false,
  error,
  description,
  className,
  ...props
}) => {
  const { isMobile } = useResponsive()

  return (
    <ResponsiveFormField
      label={label}
      required={required}
      error={error}
      description={description}
    >
      <Input
        className={cn(isMobile && touchFriendly.input, className)}
        {...props}
      />
    </ResponsiveFormField>
  )
}

interface ResponsiveTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  required?: boolean
  error?: string
  description?: string
}

const ResponsiveTextarea: React.FC<ResponsiveTextareaProps> = ({
  label,
  required = false,
  error,
  description,
  className,
  ...props
}) => {
  const { isMobile } = useResponsive()

  return (
    <ResponsiveFormField
      label={label}
      required={required}
      error={error}
      description={description}
    >
      <Textarea
        className={cn(
          isMobile && touchFriendly.input,
          'resize-none',
          className
        )}
        rows={isMobile ? 3 : 4}
        {...props}
      />
    </ResponsiveFormField>
  )
}

interface ResponsiveSelectProps {
  label: string
  required?: boolean
  error?: string
  description?: string
  placeholder?: string
  options: Array<{ value: string; label: string }>
  value?: string
  onValueChange?: (value: string) => void
}

const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  label,
  required = false,
  error,
  description,
  placeholder = 'Select an option',
  options,
  value,
  onValueChange,
}) => {
  const { isMobile } = useResponsive()

  return (
    <ResponsiveFormField
      label={label}
      required={required}
      error={error}
      description={description}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(isMobile && touchFriendly.select)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ResponsiveFormField>
  )
}

interface ResponsiveFormProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  isLoading?: boolean
  className?: string
}

const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  title,
  description,
  children,
  actions,
  isLoading = false,
  className,
}) => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <Card
      className={cn(
        'w-full',
        isMobile ? 'border-0 shadow-none' : '',
        className
      )}
    >
      <CardHeader className={cn(isMobile ? 'px-0 pb-4' : 'pb-6')}>
        <CardTitle
          className={cn(
            isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'
          )}
        >
          {title}
        </CardTitle>
        {description && (
          <p
            className={cn(
              'text-muted-foreground',
              isMobile ? 'text-sm' : 'text-base'
            )}
          >
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent
        className={cn('space-y-6', isMobile ? 'px-0 space-y-4' : '')}
      >
        <fieldset disabled={isLoading} className="space-y-4">
          {children}
        </fieldset>
        {actions && (
          <div
            className={cn(
              'flex gap-3 pt-4',
              isMobile ? 'flex-col' : 'flex-row justify-end'
            )}
          >
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ResponsiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  fullWidth?: boolean
  children: React.ReactNode
}

const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  className,
  children,
  ...props
}) => {
  const { isMobile } = useResponsive()

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        isMobile && touchFriendly.button,
        isMobile && fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

interface ResponsiveFormGridProps {
  children: React.ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

const ResponsiveFormGrid: React.FC<ResponsiveFormGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 2 },
}) => {
  return (
    <div
      className={cn(
        'grid gap-4',
        `grid-cols-${columns.mobile}`,
        `md:grid-cols-${columns.tablet}`,
        `lg:grid-cols-${columns.desktop}`
      )}
    >
      {children}
    </div>
  )
}

interface MobileFormDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const MobileFormDialog: React.FC<MobileFormDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const { isMobile } = useResponsive()

  if (!isOpen) return null

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    )
  }

  // Desktop modal would use Dialog component
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export {
  ResponsiveFormField,
  ResponsiveInput,
  ResponsiveTextarea,
  ResponsiveSelect,
  ResponsiveForm,
  ResponsiveButton,
  ResponsiveFormGrid,
  MobileFormDialog,
}
