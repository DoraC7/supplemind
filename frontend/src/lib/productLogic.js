import { addDays, differenceInDays } from "date-fns";

export const ProductStatus = {
  UNOPENED: "unopened",
  ACTIVE: "active",
  EXPIRING_SOON: "expiring_soon",
  EXPIRED: "expired",
};

export function getProductStatus(product) {
  const today = new Date();
  
  if (!product.openedDate) {
    return ProductStatus.UNOPENED;
  }
  
  const expiry = product.expiryDate ? new Date(product.expiryDate) : null;
  const opened = new Date(product.openedDate);
  const paoExpiry = product.paoMonths 
    ? addDays(opened, product.paoMonths * 30) 
    : null;
  
  const effectiveExpiry = expiry && paoExpiry 
    ? (expiry < paoExpiry ? expiry : paoExpiry)
    : expiry || paoExpiry;
  
  if (!effectiveExpiry) {
    return ProductStatus.ACTIVE;
  }
  
  const daysRemaining = differenceInDays(effectiveExpiry, today);
  
  if (daysRemaining < 0) {
    return ProductStatus.EXPIRED;
  } else if (daysRemaining <= 30) {
    return ProductStatus.EXPIRING_SOON;
  }
  
  return ProductStatus.ACTIVE;
}

export function isExpired(product) {
  return getProductStatus(product) === ProductStatus.EXPIRED;
}

export function isExpiringSoon(product) {
  return getProductStatus(product) === ProductStatus.EXPIRING_SOON;
}

export function getMonthsAfterOpening(product) {
  if (!product.openedDate || !product.paoMonths) {
    return null;
  }
  const opened = new Date(product.openedDate);
  const paoExpiry = addDays(opened, product.paoMonths * 30);
  const today = new Date();
  const daysRemaining = differenceInDays(paoExpiry, today);
  return Math.max(0, Math.floor(daysRemaining / 30));
}

export function getRoutineItems(products, profile, routineType = "morning") {
  const time = routineType === "morning" ? profile.morningRoutineTime : profile.nightRoutineTime;
  return products
    .filter(p => p.routineSlot === routineType)
    .map(p => ({
      ...p,
      status: getProductStatus(p),
    }));
}