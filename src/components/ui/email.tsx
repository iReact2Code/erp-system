import React from 'react'

interface EmailProps {
  children: React.ReactNode
  className?: string
}

// Renders email addresses with an explicit LTR direction so they don't get
// visually reversed in RTL locales. Uses `unicode-bidi` to isolate the bidi
// context for robustness.
export const Email: React.FC<EmailProps> = ({ children, className = '' }) => {
  return (
    <span
      className={className}
      dir="ltr"
      style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
    >
      {children}
    </span>
  )
}

export default Email
