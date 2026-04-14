export const CV_LIMIT: Record<string, number> = {
  FREE:       1,
  PRO:        Infinity,
  ENTERPRISE: Infinity,
}

// Which plan is required to use each templateId
export const TEMPLATE_PLAN_MAP: Record<string, 'FREE' | 'PRO'> = {
  classic:   'FREE',
  modern:    'PRO',
  technical: 'PRO',
}

// Which templateIds are accessible per plan
export const ALLOWED_TEMPLATES_BY_PLAN: Record<string, string[]> = {
  FREE:       ['classic'],
  PRO:        ['classic', 'modern', 'technical'],
  ENTERPRISE: ['classic', 'modern', 'technical'],
}

export const STRIPE_GRACE_PERIOD_DAYS = 3
