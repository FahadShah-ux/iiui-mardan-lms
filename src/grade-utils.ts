export type GradeInfo = { id: string; name: string; order: number };

export function gradeSections(gradeName: string): string[] {
  if (
    gradeName === "Nursery" ||
    gradeName === "Kindergarten" ||
    gradeName === "1st Year" ||
    gradeName === "2nd Year"
  ) {
    return [];
  }
  const num = parseInt(gradeName.replace(/\D/g, ""), 10);
  if (!Number.isNaN(num) && num >= 8 && num <= 10) return ["M", "C"];
  return ["I", "U"];
}
