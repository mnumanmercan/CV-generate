// A4 portrait dimensions in CSS pixels at 96 dpi. Height matches jsPDF's own
// conversion: 297 mm × (96 px / 25.4 mm) = 1122.68 → floor to 1122 (see the
// derivation comment in usePDFExport.ts — 1123 forced a 1-pixel second page).
// Single source for the preview surfaces, zoom fitting, and PDF capture.
export const A4_WIDTH_PX = 794
export const A4_HEIGHT_PX = 1122
