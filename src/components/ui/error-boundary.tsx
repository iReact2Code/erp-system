'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  retry?: () => void
}

export function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>Something went wrong</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {error?.message || 'An unexpected error occurred'}
        </p>
        {retry && (
          <Button onClick={retry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface ApiErrorDisplayProps {
  error: string | null
  onDismiss?: () => void
}

export function ApiErrorDisplay({ error, onDismiss }: ApiErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="ml-auto h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  )
}
