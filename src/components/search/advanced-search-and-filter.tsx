'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { useResponsive } from '@/lib/responsive-utils'
import { ResponsiveDashboardLayout } from '@/components/layout/responsive-components'
import {
  Search,
  Filter,
  X,
  Download,
  SortAsc,
  SortDesc,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Zap,
  Star,
  TrendingUp,
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'inventory' | 'sales' | 'purchases' | 'orders' | 'customers'
  title: string
  subtitle: string
  description: string
  metadata: Record<string, unknown>
  relevanceScore: number
  createdAt: Date
  updatedAt: Date
}

interface FilterCriteria {
  type: string[]
  dateRange: {
    from: Date | null
    to: Date | null
  }
  priceRange: [number, number]
  status: string[]
  tags: string[]
  priority: string[]
  category: string[]
}

// Sample data for demonstration (moved outside component to avoid re-renders)
const sampleResults: SearchResult[] = [
  {
    id: '1',
    type: 'inventory',
    title: 'Premium Wireless Headphones',
    subtitle: 'Electronics > Audio',
    description:
      'High-quality noise-canceling headphones with 30-hour battery life',
    metadata: { sku: 'WH-1000XM4', quantity: 45, price: 299.99 },
    relevanceScore: 0.95,
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-09-15'),
  },
  {
    id: '2',
    type: 'customers',
    title: 'Alex Johnson',
    subtitle: 'Premium Customer',
    description: 'Long-term customer with high purchase volume',
    metadata: {
      email: 'alex.johnson@email.com',
      totalOrders: 47,
      totalValue: 12450,
    },
    relevanceScore: 0.88,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-09-14'),
  },
  {
    id: '3',
    type: 'orders',
    title: 'Order #ORD-2024-005432',
    subtitle: 'Completed Order',
    description: 'Recent order containing electronics and accessories',
    metadata: { total: 1299.97, status: 'completed', items: 3 },
    relevanceScore: 0.82,
    createdAt: new Date('2024-09-12'),
    updatedAt: new Date('2024-09-13'),
  },
  {
    id: '4',
    type: 'sales',
    title: 'TechCorp Solutions',
    subtitle: 'Verified Supplier',
    description: 'Reliable supplier for electronic components and accessories',
    metadata: { location: 'California, USA', rating: 4.8, contracts: 12 },
    relevanceScore: 0.79,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-09-10'),
  },
  {
    id: '5',
    type: 'purchases',
    title: 'Purchase #PUR-2024-009876',
    subtitle: 'Supplier: Global Electronics',
    description: 'Bulk purchase of audio equipment inventory',
    metadata: { total: 15000, status: 'approved', items: 50 },
    relevanceScore: 0.71,
    createdAt: new Date('2024-08-25'),
    updatedAt: new Date('2024-09-01'),
  },
]

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void
}

const AdvancedSearchAndFilter: React.FC<AdvancedSearchProps> = ({
  onResultSelect,
}) => {
  const { isMobile } = useResponsive()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'name' | 'value'>(
    'relevance'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<FilterCriteria>({
    type: [],
    dateRange: { from: null, to: null },
    priceRange: [0, 10000],
    status: [],
    tags: [],
    priority: [],
    category: [],
  })

  // Simulate search API call
  const performSearch = useCallback(
    async (query: string, filters: FilterCriteria) => {
      setIsSearching(true)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      let filteredResults = sampleResults

      // Apply text search
      if (query.trim()) {
        filteredResults = filteredResults.filter(
          result =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.description.toLowerCase().includes(query.toLowerCase()) ||
            result.subtitle.toLowerCase().includes(query.toLowerCase())
        )
      }

      // Apply type filters
      if (filters.type.length > 0) {
        filteredResults = filteredResults.filter(result =>
          filters.type.includes(result.type)
        )
      }

      // Apply date range filter
      if (filters.dateRange.from && filters.dateRange.to) {
        filteredResults = filteredResults.filter(
          result =>
            result.createdAt >= filters.dateRange.from! &&
            result.createdAt <= filters.dateRange.to!
        )
      }

      // Sort results
      filteredResults.sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
          case 'relevance':
            comparison = b.relevanceScore - a.relevanceScore
            break
          case 'date':
            comparison = b.updatedAt.getTime() - a.updatedAt.getTime()
            break
          case 'name':
            comparison = a.title.localeCompare(b.title)
            break
          case 'value':
            const aValue =
              Number(a.metadata.total) || Number(a.metadata.price) || 0
            const bValue =
              Number(b.metadata.total) || Number(b.metadata.price) || 0
            comparison = bValue - aValue
            break
        }

        return sortOrder === 'desc' ? comparison : -comparison
      })

      setResults(filteredResults)
      setIsSearching(false)
    },
    [sortBy, sortOrder]
  )

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        searchQuery ||
        Object.values(selectedFilters).some(filter =>
          Array.isArray(filter)
            ? filter.length > 0
            : typeof filter === 'object' && filter !== null
              ? Object.values(filter).some(v => v !== null)
              : false
        )
      ) {
        performSearch(searchQuery, selectedFilters)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedFilters, sortBy, sortOrder, performSearch])

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'inventory':
        return <Package className="h-4 w-4" />
      case 'sales':
        return <DollarSign className="h-4 w-4" />
      case 'orders':
        return <ShoppingCart className="h-4 w-4" />
      case 'customers':
        return <Users className="h-4 w-4" />
      case 'purchases':
        return <FileText className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'inventory':
        return 'bg-blue-100 text-blue-800'
      case 'sales':
        return 'bg-green-100 text-green-800'
      case 'orders':
        return 'bg-purple-100 text-purple-800'
      case 'customers':
        return 'bg-orange-100 text-orange-800'
      case 'purchases':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const clearAllFilters = () => {
    setSelectedFilters({
      type: [],
      dateRange: { from: null, to: null },
      priceRange: [0, 10000],
      status: [],
      tags: [],
      priority: [],
      category: [],
    })
    setSearchQuery('')
  }

  const activeFilterCount =
    selectedFilters.type.length +
    selectedFilters.status.length +
    selectedFilters.tags.length +
    selectedFilters.priority.length +
    selectedFilters.category.length +
    (selectedFilters.dateRange.from ? 1 : 0)

  return (
    <div className="container mx-auto px-4 py-6">
      <ResponsiveDashboardLayout
        title="Advanced Search & Filter"
        subtitle={`${results.length} results found • ${activeFilterCount} active filters`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isAdvancedMode ? 'Simple' : 'Advanced'}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Search Input */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inventory, sales, orders, customers..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={sortBy}
                  onValueChange={(
                    value: 'relevance' | 'date' | 'name' | 'value'
                  ) => setSortBy(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Filters */}
          {isAdvancedMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="type" className="w-full">
                  <TabsList
                    className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}
                  >
                    <TabsTrigger value="type">Type</TabsTrigger>
                    <TabsTrigger value="date">Date</TabsTrigger>
                    <TabsTrigger value="price">Price</TabsTrigger>
                    <TabsTrigger value="status">Status</TabsTrigger>
                  </TabsList>

                  <TabsContent value="type" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Content Type</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          'inventory',
                          'sales',
                          'orders',
                          'customers',
                          'purchases',
                        ].map(type => (
                          <div
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={type}
                              checked={selectedFilters.type.includes(type)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setSelectedFilters(prev => ({
                                    ...prev,
                                    type: [...prev.type, type],
                                  }))
                                } else {
                                  setSelectedFilters(prev => ({
                                    ...prev,
                                    type: prev.type.filter(t => t !== type),
                                  }))
                                }
                              }}
                            />
                            <label
                              htmlFor={type}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="date" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Date Range</h4>
                      <DatePickerWithRange
                        from={selectedFilters.dateRange.from}
                        to={selectedFilters.dateRange.to}
                        onSelect={range => {
                          setSelectedFilters(prev => ({
                            ...prev,
                            dateRange: {
                              from: range?.from || null,
                              to: range?.to || null,
                            },
                          }))
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="price" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Price Range</h4>
                      <div className="px-3">
                        <Slider
                          value={selectedFilters.priceRange}
                          onValueChange={value => {
                            setSelectedFilters(prev => ({
                              ...prev,
                              priceRange: value as [number, number],
                            }))
                          }}
                          max={10000}
                          step={100}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                          <span>${selectedFilters.priceRange[0]}</span>
                          <span>${selectedFilters.priceRange[1]}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="status" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          'active',
                          'pending',
                          'completed',
                          'cancelled',
                          'draft',
                          'processing',
                        ].map(status => (
                          <div
                            key={status}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={status}
                              checked={selectedFilters.status.includes(status)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setSelectedFilters(prev => ({
                                    ...prev,
                                    status: [...prev.status, status],
                                  }))
                                } else {
                                  setSelectedFilters(prev => ({
                                    ...prev,
                                    status: prev.status.filter(
                                      s => s !== status
                                    ),
                                  }))
                                }
                              }}
                            />
                            <label
                              htmlFor={status}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                            >
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Results
                  {isSearching && (
                    <Zap className="h-4 w-4 animate-pulse text-blue-500" />
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">
                    {activeFilterCount} filters active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-muted-foreground">
                    Searching...
                  </span>
                </div>
              ) : results.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {results.map(result => (
                      <Card
                        key={result.id}
                        className="transition-all hover:shadow-md cursor-pointer"
                        onClick={() => onResultSelect?.(result)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(result.type)}
                              <Badge className={getTypeColor(result.type)}>
                                {result.type}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs text-muted-foreground">
                                  {(result.relevanceScore * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.updatedAt.toLocaleDateString()}
                            </div>
                          </div>

                          <h4 className="font-semibold mb-1">{result.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.subtitle}
                          </p>
                          <p className="text-sm mb-3">{result.description}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(result.metadata)
                                .slice(0, 3)
                                .map(([key, value]) => (
                                  <Badge
                                    key={key}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {key}:{' '}
                                    {typeof value === 'number' &&
                                    (key.includes('total') ||
                                      key.includes('price'))
                                      ? `$${value}`
                                      : String(value)}
                                  </Badge>
                                ))}
                            </div>
                            <Button variant="ghost" size="sm">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No results found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery || activeFilterCount > 0
                      ? 'Try adjusting your search terms or filters'
                      : 'Start typing to search across all your data'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ResponsiveDashboardLayout>
    </div>
  )
}

export default AdvancedSearchAndFilter
