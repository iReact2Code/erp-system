'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useResponsive } from '@/lib/responsive-utils'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface ResponsiveMetricCardProps {
  title: string
  value: string | number
  change?: number
  changePercent?: number
  trend?: 'UP' | 'DOWN' | 'STABLE'
  icon?: React.ReactNode
  formatter?: (value: number) => string
  priority?: 'high' | 'medium' | 'low'
}

const ResponsiveMetricCard: React.FC<ResponsiveMetricCardProps> = ({
  title,
  value,
  change = 0,
  changePercent = 0,
  trend = 'STABLE',
  icon,
  formatter = v => v.toString(),
  priority = 'medium',
}) => {
  const { isMobile, isTablet } = useResponsive()

  const getTrendIcon = () => {
    if (trend === 'UP')
      return <ArrowUpRight className="h-3 w-3 text-green-500" />
    if (trend === 'DOWN')
      return <ArrowDownRight className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-500" />
  }

  const getTrendColor = () => {
    if (trend === 'UP') return 'text-green-600'
    if (trend === 'DOWN') return 'text-red-600'
    return 'text-gray-600'
  }

  const formatChange = (val: number) => {
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}K`
    return Math.abs(val) < 1 ? val.toFixed(2) : val.toFixed(0)
  }

  const cardContent = (
    <>
      <CardHeader
        className={`flex flex-row items-center justify-between space-y-0 ${
          isMobile ? 'pb-1' : 'pb-2'
        }`}
      >
        <CardTitle
          className={`font-medium ${
            isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-sm'
          }`}
        >
          {isMobile && title.length > 15
            ? title.substring(0, 15) + '...'
            : title}
        </CardTitle>
        {icon && (
          <div
            className={
              isMobile ? 'text-muted-foreground' : 'text-muted-foreground'
            }
          >
            <div className={isMobile ? 'h-3 w-3' : 'h-4 w-4'}>{icon}</div>
          </div>
        )}
      </CardHeader>
      <CardContent className={isMobile ? 'pt-0' : ''}>
        <div
          className={`font-bold ${
            isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'
          }`}
        >
          {typeof value === 'number' ? formatter(value) : value}
        </div>
        {(change !== 0 || changePercent !== 0) && (
          <div
            className={`flex items-center ${
              isMobile ? 'text-xs' : 'text-xs'
            } text-muted-foreground mt-1`}
          >
            {getTrendIcon()}
            <span className={`ml-1 ${getTrendColor()}`}>
              {changePercent > 0 ? '+' : ''}
              {changePercent.toFixed(1)}%
            </span>
            {!isMobile && (
              <span className="ml-1">
                ({change > 0 ? '+' : ''}
                {formatChange(change)})
              </span>
            )}
          </div>
        )}
      </CardContent>
    </>
  )

  if (isMobile && priority === 'low') {
    return null // Hide low priority metrics on mobile
  }

  return (
    <Card
      className={`${
        isMobile
          ? 'min-h-[100px]'
          : isTablet
            ? 'min-h-[120px]'
            : 'min-h-[140px]'
      } transition-all hover:shadow-md`}
    >
      {cardContent}
    </Card>
  )
}

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div
        className={`${
          isMobile ? 'space-y-2' : 'flex items-center justify-between'
        }`}
      >
        <div>
          <h1
            className={`font-bold tracking-tight ${
              isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-muted-foreground ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div
            className={`${
              isMobile ? 'flex flex-wrap gap-2' : 'flex items-center gap-4'
            }`}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
        {children}
      </div>
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 'md',
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div
      className={`grid ${gapClasses[gap]}
      grid-cols-${columns.mobile}
      md:grid-cols-${columns.tablet}
      lg:grid-cols-${columns.desktop}
    `}
    >
      {children}
    </div>
  )
}

interface ResponsiveTableProps {
  headers: string[]
  rows: Array<Record<string, string | number | boolean>>
  mobileKeyFields?: string[]
  onRowClick?: (row: Record<string, string | number | boolean>) => void
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  headers,
  rows,
  mobileKeyFields = [],
  onRowClick,
}) => {
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <div className="space-y-3">
        {rows.map((row, index) => (
          <Card
            key={index}
            className={`p-4 ${onRowClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            <div className="space-y-2">
              {mobileKeyFields.length > 0
                ? mobileKeyFields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex justify-between">
                      <span className="text-sm font-medium">{field}</span>
                      <span className="text-sm">{row[field]}</span>
                    </div>
                  ))
                : headers.slice(0, 3).map((header, headerIndex) => (
                    <div key={headerIndex} className="flex justify-between">
                      <span className="text-sm font-medium">{header}</span>
                      <span className="text-sm">
                        {row[header.toLowerCase()]}
                      </span>
                    </div>
                  ))}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {headers.map((header, index) => (
              <th key={index} className="text-left p-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={`border-b ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {headers.map((header, headerIndex) => (
                <td key={headerIndex} className="p-2">
                  {row[header.toLowerCase()]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export {
  ResponsiveMetricCard,
  ResponsiveDashboardLayout,
  ResponsiveGrid,
  ResponsiveTable,
}
