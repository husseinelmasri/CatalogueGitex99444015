export function getPromo(item) {
  if (!item.promo) return null;
  if (!item.promo.discount || item.promo.discount <= 0) return null;

  const percent = item.promo.discount;
  const original = item.price;
  const discounted = Math.round(original * (1 - percent / 100));

  return {
    percent,
    original,
    discounted,
    endDate: item.promo.endDate ?? null,
  };
}
