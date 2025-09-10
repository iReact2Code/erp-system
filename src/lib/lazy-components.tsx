import React, {
  lazy,
  Suspense,
  ComponentType,
  useState,
  useEffect,
} from 'react'
import { LoadingState } from '@/components/ui/loading'

// Lazy loading utility with error boundary
export function createLazyComponent<T extends Record<string, unknown>>(
  importFunc: () => Promise<T>,
  componentName: keyof T,
  fallback: React.ReactNode = <LoadingState />
) {
  const LazyComponent = lazy(async () => {
    const moduleExports = await importFunc()
    return { default: moduleExports[componentName] as ComponentType<unknown> }
  })

  return function LazyWrapper(props: unknown) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as Record<string, unknown>)} />
      </Suspense>
    )
  }
}

// Pre-configured lazy components for our tables
export const LazyInventoryTable = createLazyComponent(
  () => import('@/components/inventory/inventory-table'),
  'InventoryTable',
  <LoadingState message="Loading inventory..." />
)

export const LazySalesTable = createLazyComponent(
  () => import('@/components/sales/sales-table'),
  'SalesTable',
  <LoadingState message="Loading sales..." />
)

export const LazyPurchasesTable = createLazyComponent(
  () => import('@/components/purchases/purchases-table'),
  'PurchasesTable',
  <LoadingState message="Loading purchases..." />
)

export const LazyUsersTable = createLazyComponent(
  () => import('@/components/users/users-table'),
  'UsersTable',
  <LoadingState message="Loading users..." />
)

// Lazy forms
export const LazyInventoryForm = createLazyComponent(
  () => import('@/components/inventory/inventory-form'),
  'InventoryForm',
  <LoadingState size="sm" message="Loading form..." />
)

export const LazySaleForm = createLazyComponent(
  () => import('@/components/sales/sale-form'),
  'SaleForm',
  <LoadingState size="sm" message="Loading form..." />
)

export const LazyPurchaseForm = createLazyComponent(
  () => import('@/components/purchases/purchase-form'),
  'PurchaseForm',
  <LoadingState size="sm" message="Loading form..." />
)

// Reports components (heavy components)
export const LazyReportsComponent = createLazyComponent(
  () => import('@/components/reports/reports-component'),
  'ReportsComponent',
  <LoadingState message="Loading reports..." />
)

// Component preloading utilities
export const componentPreloader = {
  // Preload all table components
  preloadTables: async () => {
    await Promise.all([
      import('@/components/inventory/inventory-table'),
      import('@/components/sales/sales-table'),
      import('@/components/purchases/purchases-table'),
      import('@/components/users/users-table'),
    ])
  },

  // Preload forms
  preloadForms: async () => {
    await Promise.all([
      import('@/components/inventory/inventory-form'),
      import('@/components/sales/sale-form'),
      import('@/components/purchases/purchase-form'),
    ])
  },

  // Preload reports (heavy component)
  preloadReports: async () => {
    await import('@/components/reports/reports-component')
  },

  // Preload everything
  preloadAll: async () => {
    await Promise.all([
      componentPreloader.preloadTables(),
      componentPreloader.preloadForms(),
      componentPreloader.preloadReports(),
    ])
  },
}

// Intersection Observer for viewport-based lazy loading
export function useViewportLazyLoading(
  elementRef: React.RefObject<HTMLElement>,
  preloadFunc: () => Promise<void>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isIntersecting) {
          setIsIntersecting(true)
          preloadFunc()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, preloadFunc, isIntersecting, options])

  return isIntersecting
}
