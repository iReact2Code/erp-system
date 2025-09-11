'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useResponsive } from '@/lib/responsive-utils'
import {
  ResponsiveDashboardLayout,
  ResponsiveGrid,
  ResponsiveMetricCard,
  ResponsiveTable,
} from '@/components/layout/responsive-components'
import {
  ResponsiveForm,
  ResponsiveInput,
  ResponsiveTextarea,
  ResponsiveSelect,
  ResponsiveButton,
  ResponsiveFormGrid,
  MobileFormDialog,
} from '@/components/layout/responsive-forms'
import MobileDashboard from '@/components/dashboard/mobile-dashboard'
import MobileInventoryManagement from '@/components/inventory/mobile-inventory'
import {
  Smartphone,
  Tablet,
  Monitor,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  Eye,
  Settings,
  Plus,
} from 'lucide-react'

// Import the actual types
interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  location: string
  status: 'active' | 'inactive' | 'discontinued'
  lastUpdated: string
}

interface FormData {
  [key: string]: string | number | boolean
}

const ResponsiveTestPage: React.FC = () => {
  const { isMobile, isTablet, width, height } = useResponsive()
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [currentDemo, setCurrentDemo] = useState<
    'components' | 'dashboard' | 'inventory'
  >('components')

  // Mock data for demos
  const mockDashboardData = {
    metrics: {
      totalRevenue: 125430.5,
      totalOrders: 1234,
      totalProducts: 567,
      totalCustomers: 890,
      revenueChange: 8500.25,
      ordersChange: 45,
      productsChange: 12,
      customersChange: 23,
    },
    recentOrders: [
      {
        id: 'ORD-001',
        customer: 'John Doe',
        amount: 299.99,
        status: 'completed' as const,
        date: '2 hours ago',
      },
      {
        id: 'ORD-002',
        customer: 'Jane Smith',
        amount: 199.5,
        status: 'processing' as const,
        date: '4 hours ago',
      },
      {
        id: 'ORD-003',
        customer: 'Bob Johnson',
        amount: 450.0,
        status: 'pending' as const,
        date: '6 hours ago',
      },
    ],
    alerts: [
      {
        id: 'ALT-001',
        type: 'warning' as const,
        message: 'Low stock alert for Premium Headphones',
        priority: 'high' as const,
      },
      {
        id: 'ALT-002',
        type: 'error' as const,
        message: 'Payment gateway timeout detected',
        priority: 'high' as const,
      },
    ],
    lowStockItems: [
      {
        id: 'INV-001',
        name: 'Premium Wireless Headphones',
        currentStock: 5,
        minStock: 10,
      },
      {
        id: 'INV-002',
        name: 'Bluetooth Speaker',
        currentStock: 2,
        minStock: 8,
      },
    ],
  }

  const mockInventoryItems = [
    {
      id: 'INV-001',
      name: 'Premium Wireless Headphones',
      sku: 'PWH-001',
      category: 'electronics',
      currentStock: 25,
      minStock: 10,
      maxStock: 100,
      unitPrice: 299.99,
      location: 'Warehouse A',
      status: 'active' as const,
      lastUpdated: '2025-09-11T10:30:00Z',
    },
    {
      id: 'INV-002',
      name: 'Bluetooth Speaker',
      sku: 'BTS-002',
      category: 'electronics',
      currentStock: 15,
      minStock: 8,
      maxStock: 50,
      unitPrice: 89.99,
      location: 'Warehouse B',
      status: 'active' as const,
      lastUpdated: '2025-09-11T09:15:00Z',
    },
    {
      id: 'INV-003',
      name: 'Running Shoes',
      sku: 'RS-003',
      category: 'sports',
      currentStock: 5,
      minStock: 15,
      maxStock: 75,
      unitPrice: 129.99,
      location: 'Warehouse A',
      status: 'active' as const,
      lastUpdated: '2025-09-11T08:45:00Z',
    },
  ]

  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className="h-5 w-5 text-blue-500" />
    if (isTablet) return <Tablet className="h-5 w-5 text-green-500" />
    return <Monitor className="h-5 w-5 text-purple-500" />
  }

  const getDeviceInfo = () => {
    const device = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'
    return {
      device,
      resolution: `${width}x${height}`,
      breakpoint: isMobile ? 'sm' : isTablet ? 'md' : 'lg+',
    }
  }

  const deviceInfo = getDeviceInfo()

  const sampleMetrics = [
    {
      title: 'Total Revenue',
      value: 125430.5,
      change: 8500.25,
      changePercent: 7.3,
      trend: 'UP' as const,
      icon: <DollarSign className="h-4 w-4" />,
      formatter: (v: number) => `$${v.toLocaleString()}`,
      priority: 'high' as const,
    },
    {
      title: 'Active Users',
      value: 1234,
      change: 45,
      changePercent: 3.8,
      trend: 'UP' as const,
      icon: <Users className="h-4 w-4" />,
      priority: 'high' as const,
    },
    {
      title: 'Products',
      value: 567,
      change: 12,
      changePercent: 2.2,
      trend: 'UP' as const,
      icon: <Package className="h-4 w-4" />,
      priority: 'medium' as const,
    },
    {
      title: 'Orders',
      value: 890,
      change: -5,
      changePercent: -0.6,
      trend: 'DOWN' as const,
      icon: <ShoppingCart className="h-4 w-4" />,
      priority: 'low' as const,
    },
  ]

  const sampleTableData = [
    {
      name: 'Product A',
      category: 'Electronics',
      stock: 25,
      price: '$299.99',
      status: 'Active',
    },
    {
      name: 'Product B',
      category: 'Clothing',
      stock: 15,
      price: '$49.99',
      status: 'Active',
    },
    {
      name: 'Product C',
      category: 'Books',
      stock: 5,
      price: '$19.99',
      status: 'Low Stock',
    },
  ]

  const handleFormSubmit = (data: FormData) => {
    console.log('Form submitted:', data)
    setShowFormDialog(false)
  }

  const handleInventoryUpdate = (item: InventoryItem) => {
    console.log('Inventory updated:', item)
  }

  const handleInventoryDelete = (id: string) => {
    console.log('Inventory deleted:', id)
  }

  const handleInventoryAdd = (
    item: Omit<InventoryItem, 'id' | 'lastUpdated'>
  ) => {
    console.log('Inventory added:', item)
  }

  const ComponentsDemo = () => (
    <div className="space-y-6">
      {/* Device Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getDeviceIcon()}
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Device Type:</span>
              <p className="text-muted-foreground">{deviceInfo.device}</p>
            </div>
            <div>
              <span className="font-medium">Resolution:</span>
              <p className="text-muted-foreground">{deviceInfo.resolution}</p>
            </div>
            <div>
              <span className="font-medium">Breakpoint:</span>
              <Badge variant="outline">{deviceInfo.breakpoint}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Metric Cards</CardTitle>
          <p className="text-sm text-muted-foreground">
            Metrics adapt to screen size - mobile shows 2 columns, desktop shows
            4
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveGrid
            columns={{ mobile: 2, tablet: 2, desktop: 4 }}
            gap="md"
          >
            {sampleMetrics.map((metric, index) => (
              <ResponsiveMetricCard key={index} {...metric} />
            ))}
          </ResponsiveGrid>
        </CardContent>
      </Card>

      {/* Responsive Table */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Table</CardTitle>
          <p className="text-sm text-muted-foreground">
            Table switches to card view on mobile for better readability
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            headers={['Name', 'Category', 'Stock', 'Price', 'Status']}
            rows={sampleTableData}
            mobileKeyFields={['Name', 'Stock', 'Price']}
          />
        </CardContent>
      </Card>

      {/* Responsive Form */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile-Optimized Forms</CardTitle>
          <p className="text-sm text-muted-foreground">
            Forms use full-screen dialogs on mobile, modals on desktop
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveButton onClick={() => setShowFormDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Open Sample Form
          </ResponsiveButton>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <ResponsiveDashboardLayout
        title="Mobile Responsiveness Demo"
        subtitle="Experience the adaptive design system across different screen sizes"
        actions={
          <div className="flex gap-2">
            <Button
              variant={currentDemo === 'components' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentDemo('components')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Components
            </Button>
            <Button
              variant={currentDemo === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentDemo('dashboard')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentDemo === 'inventory' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentDemo('inventory')}
            >
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </Button>
          </div>
        }
      >
        {currentDemo === 'components' && <ComponentsDemo />}

        {currentDemo === 'dashboard' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Dashboard Demo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Full mobile-optimized dashboard with adaptive layouts
                </p>
              </CardHeader>
            </Card>
            <MobileDashboard data={mockDashboardData} />
          </div>
        )}

        {currentDemo === 'inventory' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Inventory Management Demo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete inventory management with mobile-first design
                </p>
              </CardHeader>
            </Card>
            <MobileInventoryManagement
              items={mockInventoryItems}
              onItemUpdate={handleInventoryUpdate}
              onItemDelete={handleInventoryDelete}
              onItemAdd={handleInventoryAdd}
            />
          </div>
        )}
      </ResponsiveDashboardLayout>

      {/* Sample Form Dialog */}
      <MobileFormDialog
        isOpen={showFormDialog}
        onClose={() => setShowFormDialog(false)}
        title="Sample Form"
      >
        <ResponsiveForm
          title="Product Information"
          description="Fill out the product details below"
          actions={
            <>
              <ResponsiveButton
                variant="outline"
                onClick={() => setShowFormDialog(false)}
                fullWidth
              >
                Cancel
              </ResponsiveButton>
              <ResponsiveButton onClick={() => handleFormSubmit({})} fullWidth>
                Save Product
              </ResponsiveButton>
            </>
          }
        >
          <ResponsiveFormGrid>
            <ResponsiveInput
              label="Product Name"
              placeholder="Enter product name"
              required
            />
            <ResponsiveSelect
              label="Category"
              required
              options={[
                { value: 'electronics', label: 'Electronics' },
                { value: 'clothing', label: 'Clothing' },
                { value: 'books', label: 'Books' },
              ]}
              placeholder="Select category"
            />
          </ResponsiveFormGrid>

          <ResponsiveTextarea
            label="Description"
            placeholder="Enter product description"
            rows={3}
          />

          <ResponsiveFormGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
            <ResponsiveInput
              label="Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />
            <ResponsiveInput
              label="Stock"
              type="number"
              placeholder="0"
              required
            />
          </ResponsiveFormGrid>
        </ResponsiveForm>
      </MobileFormDialog>
    </div>
  )
}

export default ResponsiveTestPage
