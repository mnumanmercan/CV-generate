// Character and array caps for CV content. Single source of truth:
// the Zod schemas in schemas/cv.schema.ts enforce these server-side, and the
// builder forms use the same values as input maxlengths — changing a value
// here changes both sides. Values match the caps the schemas have always
// enforced, so no data migration is needed.
export const CV_LIMITS = {
  personal: {
    fullName: 100,
    jobTitle: 100,
    email: 254,
    phone: 30,
    location: 100,
    url: 500, // linkedin / github / website (draft path; strict path validates .url())
    profilePhoto: 2048,
  },
  summary: {
    max: 2000, // schema cap (abuse prevention)
    editorMax: 500, // stricter editorial cap enforced by SummaryForm's textarea
  },
  experience: {
    company: 200,
    position: 200,
    date: 20,
    location: 100,
    bullet: 500,
    maxBullets: 20,
    maxItems: 20,
  },
  education: {
    institution: 200,
    degree: 200,
    field: 200,
    date: 20,
    gpa: 10,
    maxItems: 10,
  },
  skills: {
    category: 100,
    item: 100,
    maxItemsPerCategory: 50,
    maxItems: 20,
  },
  projects: {
    name: 200,
    description: 1000,
    techItem: 50,
    maxTech: 30,
    link: 500,
    maxItems: 20,
  },
  certifications: {
    name: 200,
    issuer: 200,
    date: 7, // MM/YYYY
    strictDate: 20,
    credentialId: 100,
    credentialUrl: 500,
    maxItems: 20,
  },
  languages: {
    name: 100,
    proficiency: 50,
    maxItems: 30,
  },
  cvTitle: 200,
} as const
