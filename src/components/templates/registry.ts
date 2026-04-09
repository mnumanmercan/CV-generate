import type { Component } from 'vue'
import ClassicTemplate from './ClassicTemplate.vue'
import ModernMinimalTemplate from './ModernMinimalTemplate.vue'
import TechnicalTemplate from './TechnicalTemplate.vue'

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  component: Component
  isPro: boolean
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, universally ATS-compatible format',
    component: ClassicTemplate,
    isPro: false,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Airy layout with contemporary typography',
    component: ModernMinimalTemplate,
    isPro: true,
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Skills-first layout for engineers and developers',
    component: TechnicalTemplate,
    isPro: true,
  },
]

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}
