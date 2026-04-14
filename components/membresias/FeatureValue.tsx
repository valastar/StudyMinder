'use client'
import { Check, X } from 'lucide-react'

export default function FeatureValue({ value }: { value: string | boolean }) {
  if (value === false) return <X size={14} className="text-surface-800/20 mx-auto" />
  if (value === true)  return <Check size={15} className="text-emerald-500 mx-auto" />
  return <span className="text-xs text-surface-800/70 font-medium">{value as string}</span>
}