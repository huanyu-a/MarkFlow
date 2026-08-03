import { type TextareaHTMLAttributes, forwardRef } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    const baseStyles =
      'w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 outline-none transition-colors focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 disabled:bg-slate-50 disabled:opacity-50 resize-none'
    const classes = [baseStyles, className].filter(Boolean).join(' ')
    return <textarea ref={ref} className={classes} {...props} />
  },
)
Textarea.displayName = 'Textarea'
