// 计算食材新鲜度百分比（0-100）
export function calculateFreshness(productionDate: string, shelfLifeDays: number): number {
  const production = new Date(productionDate);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - production.getTime()) / (1000 * 60 * 60 * 24));
  const remaining = shelfLifeDays - daysPassed;
  const percentage = Math.max(0, Math.min(100, (remaining / shelfLifeDays) * 100));
  return percentage;
}

// 判断是否临期（剩余不足20%）
export function isExpiringSoon(productionDate: string, shelfLifeDays: number): boolean {
  return calculateFreshness(productionDate, shelfLifeDays) < 20;
}

// 判断是否已过期
export function isExpired(productionDate: string, shelfLifeDays: number): boolean {
  return calculateFreshness(productionDate, shelfLifeDays) <= 0;
}

