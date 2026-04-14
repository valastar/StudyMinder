'use client'
import { Check } from 'lucide-react'
import { ElementType } from 'react'

interface FeatureRowProps {
  icon: ElementType
  text: string
  pro?: boolean
}

export default function FeatureRow({ icon: Icon, text, pro }: FeatureRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Check size={12} className={pro ? 'text-accent' : 'text-emerald-400'} />
      <span className="text-xs text-surface-800/60">{text}</span>
    </div>
  )
}