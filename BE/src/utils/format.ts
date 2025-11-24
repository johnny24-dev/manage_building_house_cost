export const formatCurrency = (value?: number | null): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return undefined;
  }

  return `${numericValue.toLocaleString('vi-VN')} ₫`;
};

export const formatDate = (value?: Date | string | null): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleDateString('vi-VN');
};



