// Fallback declaration to ensure TypeScript recognizes react-window types in case of resolution glitch.
// If official @types/react-window works, this is harmless; it augments module.
declare module 'react-window' {
  import * as React from 'react'
  export interface ListChildComponentProps<Data = unknown> {
    index: number
    style: React.CSSProperties
    data: Data
    isScrolling?: boolean
    isVisible?: boolean
  }
  interface FixedSizeListProps<Data = unknown> {
    height: number
    width: number | string
    itemCount: number
    itemSize: number
    itemData?: Data
    className?: string
    children: React.ComponentType<ListChildComponentProps<Data>>
  }
  export class FixedSizeList<Data = unknown> extends React.Component<
    FixedSizeListProps<Data>
  > {}
  export { FixedSizeList as List }
}
