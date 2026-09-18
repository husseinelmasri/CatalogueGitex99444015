export function formatPrice(amount) {
  return 'NLe ' + new Intl.NumberFormat('en-US').format(amount);
}
