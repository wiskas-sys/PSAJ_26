export const DEFAULT_BANK = {
  bankName: 'Bank BCA',
  accountNumber: '0461782991',
  accountHolder: 'DIAN MOTOR',
};

export function getBankConfig() {
  if (typeof window === 'undefined') return DEFAULT_BANK;
  try {
    const raw = window.localStorage.getItem('dian_motor_bank_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BANK, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_BANK;
}

export function saveBankConfig(cfg) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('dian_motor_bank_config', JSON.stringify(cfg));
  } catch (e) {}
}
