export const validateHours = (value: string): boolean => {
  if (!value) return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  const decimal = num % 1;
  return decimal === 0 || decimal === 0.5;
};

export const validateAmount = (value: string): boolean => {
  const num = parseFloat(value.replace(/[$,]/g, ""));
  return !isNaN(num) && num >= 0;
};

export const formatCurrency = (value: string): string => {
  const num = parseFloat(value.replace(/[$,]/g, ""));
  if (isNaN(num)) return "";
  return `$${num.toFixed(2)}`;
};

export const parseDate = (dateStr: string): Date | null => {
  const [month, day, year] = dateStr.split("/");
  if (!month || !day || !year) return null;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(date.getTime())) return null;
  return date;
};

export const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

export const calculateTotal = (amount: string, upcharge: string): number => {
  const amountNum = parseFloat(amount.replace(/[$,]/g, "")) || 0;
  const upchargeNum = parseFloat(upcharge.replace(/[$,]/g, "")) || 0;
  return amountNum + upchargeNum;
};
