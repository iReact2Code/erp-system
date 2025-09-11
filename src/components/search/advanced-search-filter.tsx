'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useResponsive } from '@/lib/responsive-utils'
import { ResponsiveDashboardLayout } from '@/components/layout/responsive-components'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  FileText,
  Clock,
  Tag,
  Download,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'inventory' | 'order' | 'customer' | 'invoice' | 'purchase'
  title: string
  subtitle: string
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>
  relevanceScore: number
  lastUpdated: Date
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'
  tags: string[]
}

interface SearchFilters {
  type: string[]
  status: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
  tags: string[]
  location: string
  minAmount: number | null
  maxAmount: number | null
}

const AdvancedSearchFilterPage: React.FC = () => {
  const { isMobile } = useResponsive()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    status: [],
    dateRange: { from: null, to: null },
    tags: [],
    location: '',
    minAmount: null,
    maxAmount: null,
  })
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'amount'>(
    'relevance'
  )
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Mock data for demonstration
  const mockData: SearchResult[] = useMemo(
    () => [
      {
        id: 'inv-001',
        type: 'inventory',
        title: 'Premium Wireless Headphones',
        subtitle: 'SKU: PWH-2024-001',
        description: 'High-quality wireless headphones with noise cancellation',
        metadata: { stock: 25, price: 299.99, category: 'Electronics' },
        relevanceScore: 0.95,
        lastUpdated: new Date('2024-01-15'),
        status: 'active',
        tags: ['electronics', 'audio', 'premium'],
      },
      {
        id: 'ord-002',
        type: 'order',
        title: 'Order #ORD-2024-001234',
        subtitle: 'Customer: John Doe',
        description: 'Order containing 3 items with total value $850',
        metadata: { total: 850, items: 3, customer: 'John Doe' },
        relevanceScore: 0.88,
        lastUpdated: new Date('2024-01-14'),
        status: 'completed',
        tags: ['bulk-order', 'electronics'],
      },
      {
        id: 'cust-003',
        type: 'customer',
        title: 'Jane Smith',
        subtitle: 'Premium Customer',
        description: 'Long-term customer with excellent payment history',
        metadata: {
          totalOrders: 45,
          lifetimeValue: 12500,
          location: 'New York',
        },
        relevanceScore: 0.82,
        lastUpdated: new Date('2024-01-13'),
        status: 'active',
        tags: ['premium', 'loyal-customer', 'high-value'],
      },
      {
        id: 'inv-004',
        type: 'invoice',
        title: 'Invoice #INV-2024-5678',
        subtitle: 'Due: January 20, 2024',
        description: 'Pending invoice for services rendered',
        metadata: { amount: 1250, dueDate: '2024-01-20', customer: 'ABC Corp' },
        relevanceScore: 0.76,
        lastUpdated: new Date('2024-01-12'),
        status: 'pending',
        tags: ['services', 'pending-payment'],
      },
      {
        id: 'pur-005',
        type: 'purchase',
        title: 'Purchase Order #PO-2024-999',
        subtitle: 'Supplier: Tech Solutions Inc',
        description: 'Bulk purchase of electronic components',
        metadata: { amount: 5600, supplier: 'Tech Solutions Inc', items: 15 },
        relevanceScore: 0.69,
        lastUpdated: new Date('2024-01-11'),
        status: 'completed',
        tags: ['electronics', 'components', 'bulk'],
      },
    ],
    []
  )

  const performSearch = useCallback(
    (query: string, currentFilters: SearchFilters) => {
      setIsSearching(true)

      // Simulate API call
      setTimeout(() => {
        const filteredResults = mockData.filter(item => {
          // Text search
          const matchesQuery =
            !query ||
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.tags.some(tag =>
              tag.toLowerCase().includes(query.toLowerCase())
            )

          // Type filter
          const matchesType =
            currentFilters.type.length === 0 ||
            currentFilters.type.includes(item.type)

          // Status filter
          const matchesStatus =
            currentFilters.status.length === 0 ||
            currentFilters.status.includes(item.status)

          // Date range filter
          const matchesDateRange =
            (!currentFilters.dateRange.from ||
              item.lastUpdated >= currentFilters.dateRange.from) &&
            (!currentFilters.dateRange.to ||
              item.lastUpdated <= currentFilters.dateRange.to)

          // Tags filter
          const matchesTags =
            currentFilters.tags.length === 0 ||
            currentFilters.tags.some(tag => item.tags.includes(tag))

          // Amount filter (for applicable types)
          const hasAmount =
            'amount' in item.metadata ||
            'price' in item.metadata ||
            'total' in item.metadata
          const itemAmount =
            item.metadata.amount ||
            item.metadata.price ||
            item.metadata.total ||
            0
          const matchesAmount =
            !hasAmount ||
            ((!currentFilters.minAmount ||
              itemAmount >= currentFilters.minAmount) &&
              (!currentFilters.maxAmount ||
                itemAmount <= currentFilters.maxAmount))

          return (
            matchesQuery &&
            matchesType &&
            matchesStatus &&
            matchesDateRange &&
            matchesTags &&
            matchesAmount
          )
        })

        // Sort results
        filteredResults.sort((a, b) => {
          switch (sortBy) {
            case 'date':
              return b.lastUpdated.getTime() - a.lastUpdated.getTime()
            case 'amount':
              const aAmount =
                a.metadata.amount || a.metadata.price || a.metadata.total || 0
              const bAmount =
                b.metadata.amount || b.metadata.price || b.metadata.total || 0
              return bAmount - aAmount
            default:
              return b.relevanceScore - a.relevanceScore
          }
        })

        setResults(filteredResults)
        setIsSearching(false)
      }, 500)
    },
    [sortBy, mockData]
  )

  const handleSearch = useCallback(() => {
    performSearch(searchQuery, filters)
  }, [searchQuery, filters, performSearch])

  const updateFilter = useCallback(
    (key: keyof SearchFilters, value: unknown) => {
      setFilters(prev => ({ ...prev, [key]: value }))
    },
    []
  )

  const clearFilters = () => {
    setFilters({
      type: [],
      status: [],
      dateRange: { from: null, to: null },
      tags: [],
      location: '',
      minAmount: null,
      maxAmount: null,
    })
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'inventory':
        return <Package className="h-4 w-4" />
      case 'order':
        return <ShoppingCart className="h-4 w-4" />
      case 'customer':
        return <Users className="h-4 w-4" />
      case 'invoice':
        return <FileText className="h-4 w-4" />
      case 'purchase':
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: SearchResult['status']) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const activeFilterCount = useMemo(() => {
    return (
      filters.type.length +
      filters.status.length +
      filters.tags.length +
      (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
      (filters.location ? 1 : 0) +
      (filters.minAmount !== null || filters.maxAmount !== null ? 1 : 0)
    )
  }, [filters])

  return (
    <div className="container mx-auto px-4 py-6">
      <ResponsiveDashboardLayout
        title="Advanced Search & Filter"
        subtitle={`${results.length} results found${activeFilterCount > 0 ? ` • ${activeFilterCount} filters active` : ''}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? 'Grid View' : 'List View'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search across all modules..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div
            className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}
          >
            {/* Filters Sidebar */}
            {!isMobile && (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary">{activeFilterCount}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Type
                    </label>
                    <div className="space-y-2">
                      {[
                        'inventory',
                        'order',
                        'customer',
                        'invoice',
                        'purchase',
                      ].map(type => (
                        <label
                          key={type}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={filters.type.includes(type)}
                            onChange={e => {
                              if (e.target.checked) {
                                updateFilter('type', [...filters.type, type])
                              } else {
                                updateFilter(
                                  'type',
                                  filters.type.filter(t => t !== type)
                                )
                              }
                            }}
                          />
                          <span className="capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Status
                    </label>
                    <div className="space-y-2">
                      {[
                        'active',
                        'pending',
                        'completed',
                        'cancelled',
                        'inactive',
                      ].map(status => (
                        <label
                          key={status}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={e => {
                              if (e.target.checked) {
                                updateFilter('status', [
                                  ...filters.status,
                                  status,
                                ])
                              } else {
                                updateFilter(
                                  'status',
                                  filters.status.filter(s => s !== status)
                                )
                              }
                            }}
                          />
                          <span className="capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Date Range
                    </label>
                    <div className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateRange.from
                              ? format(filters.dateRange.from, 'PPP')
                              : 'From date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.from || undefined}
                            onSelect={date =>
                              updateFilter('dateRange', {
                                ...filters.dateRange,
                                from: date,
                              })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateRange.to
                              ? format(filters.dateRange.to, 'PPP')
                              : 'To date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.dateRange.to || undefined}
                            onSelect={date =>
                              updateFilter('dateRange', {
                                ...filters.dateRange,
                                to: date,
                              })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Amount Range
                    </label>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Min amount"
                        value={filters.minAmount || ''}
                        onChange={e =>
                          updateFilter(
                            'minAmount',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max amount"
                        value={filters.maxAmount || ''}
                        onChange={e =>
                          updateFilter(
                            'maxAmount',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Area */}
            <div
              className={`space-y-4 ${isMobile ? 'col-span-1' : 'col-span-3'}`}
            >
              {/* Sort and View Controls */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Sort by:
                  </span>
                  <Select
                    value={sortBy}
                    onValueChange={(value: 'relevance' | 'date' | 'amount') =>
                      setSortBy(value)
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results */}
              <ScrollArea className="h-[600px]">
                <div
                  className={`space-y-3 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}
                >
                  {results.length > 0 ? (
                    results.map(result => (
                      <Card
                        key={result.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(result.type)}
                              <Badge variant="outline" className="capitalize">
                                {result.type}
                              </Badge>
                              {getStatusIcon(result.status)}
                              <Badge variant="secondary" className="capitalize">
                                {result.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(result.relevanceScore * 100)}% match
                            </span>
                          </div>

                          <h4 className="font-semibold mb-1">{result.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.subtitle}
                          </p>
                          <p className="text-sm mb-3">{result.description}</p>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {result.tags.map(tag => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Updated: {format(result.lastUpdated, 'PPP')}
                            </span>
                            {(result.metadata.amount ||
                              result.metadata.price ||
                              result.metadata.total) && (
                              <span className="font-medium">
                                $
                                {(
                                  result.metadata.amount ||
                                  result.metadata.price ||
                                  result.metadata.total
                                ).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : isSearching ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Searching...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No results found
                      </h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </ResponsiveDashboardLayout>
    </div>
  )
}

export default AdvancedSearchFilterPage
