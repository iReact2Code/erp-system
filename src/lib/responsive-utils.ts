// Mobile responsiveness utilities and breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export type Breakpoint = keyof typeof breakpoints

// Mobile device detection
export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

export const isTablet = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

export const isDesktop = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 1024
}

// Touch device detection
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Responsive hook for component behavior
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    ...windowSize,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    isTouchDevice: isTouchDevice(),
  }
}

// Responsive grid utilities
export const getResponsiveColumns = (
  mobile: number,
  tablet: number,
  desktop: number
) => {
  return `grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`
}

// Mobile-optimized spacing
export const responsiveSpacing = {
  xs: 'space-y-2 md:space-y-3 lg:space-y-4',
  sm: 'space-y-3 md:space-y-4 lg:space-y-6',
  md: 'space-y-4 md:space-y-6 lg:space-y-8',
  lg: 'space-y-6 md:space-y-8 lg:space-y-12',
}

// Mobile-optimized padding
export const responsivePadding = {
  xs: 'p-2 md:p-3 lg:p-4',
  sm: 'p-3 md:p-4 lg:p-6',
  md: 'p-4 md:p-6 lg:p-8',
  lg: 'p-6 md:p-8 lg:p-12',
}

// Touch-friendly sizing
export const touchFriendly = {
  minHeight: 'min-h-[44px]', // Apple's recommended minimum touch target
  minWidth: 'min-w-[44px]',
  button: 'min-h-[44px] min-w-[44px] touch-manipulation',
  input: 'min-h-[44px] touch-manipulation',
  select: 'min-h-[44px] touch-manipulation',
}

// Mobile-specific animations
export const mobileAnimations = {
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  fadeIn: 'animate-in fade-in duration-200',
  slideOut: 'animate-out slide-out-to-right duration-300',
}

// Responsive text sizes
export const responsiveText = {
  xs: 'text-xs md:text-sm',
  sm: 'text-sm md:text-base',
  base: 'text-sm md:text-base lg:text-lg',
  lg: 'text-base md:text-lg lg:text-xl',
  xl: 'text-lg md:text-xl lg:text-2xl',
  '2xl': 'text-xl md:text-2xl lg:text-3xl',
  '3xl': 'text-2xl md:text-3xl lg:text-4xl',
}

// Mobile-optimized container
export const mobileContainer = 'px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'

// Responsive flex utilities
export const responsiveFlex = {
  column: 'flex flex-col md:flex-row',
  columnReverse: 'flex flex-col-reverse md:flex-row',
  wrap: 'flex flex-wrap',
}

// Mobile-specific z-index values
export const mobileZIndex = {
  sidebar: 'z-40',
  overlay: 'z-30',
  dropdown: 'z-50',
  modal: 'z-50',
  toast: 'z-60',
}

import { useState, useEffect } from 'react'
