'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { useResponsive } from '@/lib/responsive-utils'
import { ResponsiveDashboardLayout } from '@/components/layout/responsive-components'
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Settings,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Package,
  DollarSign,
  BarChart3,
  Target,
  Globe,
} from 'lucide-react'

interface ExportFormat {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  extensions: string[]
  features: string[]
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'sales' | 'inventory' | 'financial' | 'operational' | 'analytics'
  fields: string[]
  icon: React.ReactNode
  estimatedTime: string
}

interface ExportJob {
  id: string
  name: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: Date
  completedAt?: Date
  fileSize?: string
  downloadUrl?: string
}

const DataExportAndReporting: React.FC = () => {
  const { isMobile } = useResponsive()
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{
    from: Date | null
    to: Date | null
  }>({
    from: null,
    to: null,
  })
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Monthly Sales Report',
      format: 'PDF',
      status: 'completed',
      progress: 100,
      createdAt: new Date('2024-09-10T10:30:00'),
      completedAt: new Date('2024-09-10T10:32:15'),
      fileSize: '2.4 MB',
      downloadUrl: '#',
    },
    {
      id: '2',
      name: 'Inventory Summary',
      format: 'Excel',
      status: 'processing',
      progress: 65,
      createdAt: new Date('2024-09-11T09:15:00'),
      fileSize: '1.8 MB',
    },
    {
      id: '3',
      name: 'Customer Analytics',
      format: 'CSV',
      status: 'pending',
      progress: 0,
      createdAt: new Date('2024-09-11T11:00:00'),
    },
  ])
  const [customReportName, setCustomReportName] = useState('')
  const [customReportDescription, setCustomReportDescription] = useState('')

  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Report',
      icon: <FileText className="h-5 w-5" />,
      description: 'Professional formatted report with charts and styling',
      extensions: ['.pdf'],
      features: [
        'Charts & Graphs',
        'Professional Layout',
        'Print Ready',
        'Digital Signatures',
      ],
    },
    {
      id: 'excel',
      name: 'Excel Spreadsheet',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      description: 'Interactive spreadsheet with formulas and pivot tables',
      extensions: ['.xlsx', '.xls'],
      features: [
        'Pivot Tables',
        'Formulas',
        'Multiple Sheets',
        'Data Validation',
      ],
    },
    {
      id: 'csv',
      name: 'CSV Data',
      icon: <FileText className="h-5 w-5" />,
      description: 'Raw data export for analysis and integration',
      extensions: ['.csv'],
      features: [
        'Raw Data',
        'Universal Compatibility',
        'Fast Export',
        'Large Datasets',
      ],
    },
    {
      id: 'image',
      name: 'Image Export',
      icon: <FileImage className="h-5 w-5" />,
      description: 'Charts and dashboards as high-quality images',
      extensions: ['.png', '.jpg', '.svg'],
      features: [
        'High Resolution',
        'Multiple Formats',
        'Chart Export',
        'Dashboard Snapshots',
      ],
    },
  ]

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'sales-summary',
      name: 'Sales Summary Report',
      description: 'Comprehensive sales performance analysis',
      category: 'sales',
      fields: [
        'sales_total',
        'sales_count',
        'customer_breakdown',
        'product_performance',
      ],
      icon: <DollarSign className="h-5 w-5" />,
      estimatedTime: '2-3 minutes',
    },
    {
      id: 'inventory-status',
      name: 'Inventory Status Report',
      description: 'Current stock levels and inventory analysis',
      category: 'inventory',
      fields: [
        'stock_levels',
        'low_stock_alerts',
        'inventory_value',
        'turnover_rate',
      ],
      icon: <Package className="h-5 w-5" />,
      estimatedTime: '1-2 minutes',
    },
    {
      id: 'customer-analytics',
      name: 'Customer Analytics Report',
      description: 'Customer behavior and purchasing patterns',
      category: 'analytics',
      fields: [
        'customer_segments',
        'purchase_history',
        'retention_metrics',
        'lifetime_value',
      ],
      icon: <Users className="h-5 w-5" />,
      estimatedTime: '3-4 minutes',
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary Report',
      description: 'Revenue, costs, and profitability analysis',
      category: 'financial',
      fields: [
        'revenue_breakdown',
        'cost_analysis',
        'profit_margins',
        'financial_trends',
      ],
      icon: <BarChart3 className="h-5 w-5" />,
      estimatedTime: '2-3 minutes',
    },
    {
      id: 'operations-kpi',
      name: 'Operations KPI Dashboard',
      description: 'Key performance indicators and operational metrics',
      category: 'operational',
      fields: [
        'order_fulfillment',
        'processing_times',
        'error_rates',
        'efficiency_metrics',
      ],
      icon: <Target className="h-5 w-5" />,
      estimatedTime: '1-2 minutes',
    },
  ]

  const availableFields = [
    { id: 'sales_total', label: 'Sales Total', category: 'Sales' },
    { id: 'sales_count', label: 'Number of Sales', category: 'Sales' },
    {
      id: 'customer_breakdown',
      label: 'Customer Breakdown',
      category: 'Sales',
    },
    {
      id: 'product_performance',
      label: 'Product Performance',
      category: 'Sales',
    },
    { id: 'stock_levels', label: 'Stock Levels', category: 'Inventory' },
    {
      id: 'low_stock_alerts',
      label: 'Low Stock Alerts',
      category: 'Inventory',
    },
    { id: 'inventory_value', label: 'Inventory Value', category: 'Inventory' },
    { id: 'turnover_rate', label: 'Turnover Rate', category: 'Inventory' },
    {
      id: 'customer_segments',
      label: 'Customer Segments',
      category: 'Analytics',
    },
    {
      id: 'purchase_history',
      label: 'Purchase History',
      category: 'Analytics',
    },
    {
      id: 'retention_metrics',
      label: 'Retention Metrics',
      category: 'Analytics',
    },
    {
      id: 'lifetime_value',
      label: 'Customer Lifetime Value',
      category: 'Analytics',
    },
  ]

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = reportTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedFields(template.fields)
    }
  }

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    )
  }

  const generateReport = () => {
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: customReportName || 'Custom Report',
      format: selectedFormat.toUpperCase(),
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    }

    setExportJobs(prev => [newJob, ...prev])

    // Simulate processing
    setTimeout(() => {
      setExportJobs(prev =>
        prev.map(job =>
          job.id === newJob.id
            ? { ...job, status: 'processing', progress: 10 }
            : job
        )
      )

      // Simulate progress updates
      const interval = setInterval(() => {
        setExportJobs(prev =>
          prev.map(job => {
            if (job.id === newJob.id && job.progress < 100) {
              const newProgress = Math.min(
                job.progress + Math.random() * 20,
                100
              )
              const isCompleted = newProgress >= 100

              return {
                ...job,
                progress: newProgress,
                status: isCompleted ? 'completed' : 'processing',
                completedAt: isCompleted ? new Date() : undefined,
                fileSize: isCompleted
                  ? `${(Math.random() * 5 + 1).toFixed(1)} MB`
                  : undefined,
                downloadUrl: isCompleted ? '#' : undefined,
              }
            }
            return job
          })
        )
      }, 1000)

      setTimeout(() => clearInterval(interval), 8000)
    }, 1000)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ResponsiveDashboardLayout
        title="Data Export & Reporting"
        subtitle="Generate comprehensive reports and export data in multiple formats"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Globe className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        }
      >
        <Tabs defaultValue="generate" className="w-full">
          <TabsList
            className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}
          >
            <TabsTrigger value="generate">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Export History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Export Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Format</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exportFormats.map(format => (
                    <div
                      key={format.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{format.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{format.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {format.description}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {format.features.slice(0, 2).map(feature => (
                              <Badge
                                key={feature}
                                variant="outline"
                                className="text-xs"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Report Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Report Name
                    </label>
                    <Input
                      placeholder="Enter report name..."
                      value={customReportName}
                      onChange={e => setCustomReportName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Description
                    </label>
                    <Textarea
                      placeholder="Report description..."
                      value={customReportDescription}
                      onChange={e => setCustomReportDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Date Range
                    </label>
                    <DatePickerWithRange
                      from={dateRange.from}
                      to={dateRange.to}
                      onSelect={range =>
                        setDateRange({
                          from: range?.from || null,
                          to: range?.to || null,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Fields to Include
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableFields.map(field => (
                        <div
                          key={field.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={field.id}
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={() => handleFieldToggle(field.id)}
                          />
                          <label htmlFor={field.id} className="text-sm flex-1">
                            {field.label}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {field.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={generateReport}
                    className="w-full"
                    disabled={selectedFields.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {reportTemplates.map(template => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === template.id
                          ? 'ring-2 ring-blue-500'
                          : ''
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{template.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">
                              {template.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {template.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge
                                className={`text-xs capitalize ${
                                  template.category === 'sales'
                                    ? 'bg-green-100 text-green-800'
                                    : template.category === 'inventory'
                                      ? 'bg-blue-100 text-blue-800'
                                      : template.category === 'financial'
                                        ? 'bg-purple-100 text-purple-800'
                                        : template.category === 'operational'
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {template.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {template.estimatedTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exportJobs.map(job => (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <h4 className="font-semibold">{job.name}</h4>
                            <Badge variant="outline">{job.format}</Badge>
                          </div>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>

                        {job.status === 'processing' && (
                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{Math.round(job.progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>
                              Created: {job.createdAt.toLocaleString()}
                            </span>
                            {job.completedAt && (
                              <span>
                                Completed: {job.completedAt.toLocaleString()}
                              </span>
                            )}
                            {job.fileSize && <span>Size: {job.fileSize}</span>}
                          </div>
                          {job.status === 'completed' && job.downloadUrl && (
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ResponsiveDashboardLayout>
    </div>
  )
}

export default DataExportAndReporting
