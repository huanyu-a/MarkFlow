import { type InputHTMLAttributes, forwardRef } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`h-3.5 w-3.5 rounded border-slate-300 accent-[var(--accent)] ${className}`.trim()}
        {...props}
      />
    )
  },
)
Checkbox.displayName = 'Checkbox'
