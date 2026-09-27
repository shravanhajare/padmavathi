/** Indian mobile numbers: accepts "+91 95900 77817", "095900 77817", "9590077817"; returns 10 digits or null. */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export const formatPhone = (tenDigits: string) => `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
