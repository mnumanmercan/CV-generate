import type { Prisma } from '@prisma/client'

// Normalise an arbitrary value into a JSON-safe payload Prisma will accept on
// a JSONB column. Round-tripping through JSON serialisation strips `undefined`,
// converts `Date` to ISO strings, and surfaces any non-serialisable input as a
// runtime error here rather than silently corrupting the row downstream.
//
// Use for every JSONB write — never write `value as unknown as object` directly.
export function toPrismaJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
