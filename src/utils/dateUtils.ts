/**
 * 计算剩余天数
 * @param expiryDate 过期日期 (YYYY-MM-DD)
 * @returns 剩余天数
 */
export function calculateRemainingDays(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * 计算新鲜度百分比
 * @param productionDate 生产日期 (YYYY-MM-DD)
 * @param expiryDate 过期日期 (YYYY-MM-DD)
 * @returns 新鲜度百分比 (0-100)
 */
export function calculateFreshness(productionDate: string, expiryDate: string): number {
  const production = new Date(productionDate).getTime();
  const expiry = new Date(expiryDate).getTime();
  const now = Date.now();
  
  const total = expiry - production;
  const elapsed = now - production;
  
  if (total <= 0) return 0;
  const freshness = Math.max(0, Math.min(100, ((total - elapsed) / total) * 100));
  return Math.round(freshness);
}

/**
 * 判断是否即将过期
 * @param expiryDate 过期日期 (YYYY-MM-DD)
 * @param threshold 阈值天数（默认3天）
 * @returns 是否即将过期
 */
export function isExpiringSoon(expiryDate: string, threshold: number = 3): boolean {
  const remainingDays = calculateRemainingDays(expiryDate);
  return remainingDays > 0 && remainingDays <= threshold;
}

/**
 * 判断是否已过期
 * @param expiryDate 过期日期 (YYYY-MM-DD)
 * @returns 是否已过期
 */
export function isExpired(expiryDate: string): boolean {
  const remainingDays = calculateRemainingDays(expiryDate);
  return remainingDays <= 0;
}

/**
 * 格式化日期显示
 * @param dateString 日期字符串 (YYYY-MM-DD)
 * @returns 格式化后的日期 (MM月DD日)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}


