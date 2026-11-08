/** Bank details usually requested for international wire instructions.
 * This is a UI guide, not validation that a bank can receive or settle a wire.
 */
export type DestinationCountry = {
  code: string;
  label: string;
  flag: string;
  currency: string;
  accountLabel: string;
  accountPlaceholder: string;
  iban: boolean;
  bankCodeLabel?: string;
  bankCodePlaceholder?: string;
  bankCodeRequired?: boolean;
  hint: string;
};

export const DESTINATION_COUNTRIES: DestinationCountry[] = [
  { code: "DE", label: "Germany", flag: "🇩🇪", currency: "EUR", accountLabel: "Recipient IBAN", accountPlaceholder: "DE89 3704 0044 ...", iban: true, hint: "German IBAN and beneficiary bank BIC/SWIFT." },
  { code: "FR", label: "France", flag: "🇫🇷", currency: "EUR", accountLabel: "Recipient IBAN", accountPlaceholder: "FR76 3000 6000 ...", iban: true, hint: "French IBAN and beneficiary bank BIC/SWIFT." },
  { code: "IT", label: "Italy", flag: "🇮🇹", currency: "EUR", accountLabel: "Recipient IBAN", accountPlaceholder: "IT60 X054 2811 ...", iban: true, hint: "Italian IBAN and beneficiary bank BIC/SWIFT." },
  { code: "ES", label: "Spain", flag: "🇪🇸", currency: "EUR", accountLabel: "Recipient IBAN", accountPlaceholder: "ES91 2100 0418 ...", iban: true, hint: "Spanish IBAN and beneficiary bank BIC/SWIFT." },
  { code: "NL", label: "Netherlands", flag: "🇳🇱", currency: "EUR", accountLabel: "Recipient IBAN", accountPlaceholder: "NL91 ABNA 0417 ...", iban: true, hint: "Dutch IBAN and beneficiary bank BIC/SWIFT." },
  { code: "BE", label: "Belgium", flag: "🇧🇪", currency: "EUR", accountLabel: "Recipient IBAN", accountPlaceholder: "BE68 5390 0754 ...", iban: true, hint: "Belgian IBAN and beneficiary bank BIC/SWIFT." },
  { code: "PT", label: "Portugal", flag: "🇵🇹", currency: "EUR", accountLabel: "Recipient IBAN", accountPlaceholder: "PT50 0002 0123 ...", iban: true, hint: "Portuguese IBAN and beneficiary bank BIC/SWIFT." },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧", currency: "GBP", accountLabel: "Recipient IBAN", accountPlaceholder: "GB29 NWBK 6016 ...", iban: true, hint: "For an international wire ask the beneficiary for their IBAN and SWIFT/BIC; sort code may also be requested." },
  { code: "CH", label: "Switzerland", flag: "🇨🇭", currency: "CHF", accountLabel: "Recipient IBAN", accountPlaceholder: "CH93 0076 2011 ...", iban: true, hint: "Swiss IBAN and the bank SWIFT/BIC." },
  { code: "US", label: "United States", flag: "🇺🇸", currency: "USD", accountLabel: "Recipient account number", accountPlaceholder: "Account number issued by the receiving bank", iban: false, bankCodeLabel: "ABA routing number", bankCodePlaceholder: "9 digits, issued by the receiving bank", bankCodeRequired: true, hint: "Ask the beneficiary for wire instructions: account number, wire routing number and SWIFT/BIC. ACH and wire routing numbers can differ." },
  { code: "CA", label: "Canada", flag: "🇨🇦", currency: "CAD", accountLabel: "Recipient account number", accountPlaceholder: "Recipient bank account number", iban: false, bankCodeLabel: "Institution / transit numbers", bankCodePlaceholder: "Receiving bank's institution and branch codes", bankCodeRequired: true, hint: "Canadian account, transit/institution details and receiving bank SWIFT/BIC." },
  { code: "AU", label: "Australia", flag: "🇦🇺", currency: "AUD", accountLabel: "Recipient account number", accountPlaceholder: "Recipient bank account number", iban: false, bankCodeLabel: "BSB", bankCodePlaceholder: "Six-digit branch code", bankCodeRequired: true, hint: "Australian account number, BSB and receiving bank SWIFT/BIC." },
  { code: "JP", label: "Japan", flag: "🇯🇵", currency: "JPY", accountLabel: "Recipient account number", accountPlaceholder: "Recipient bank account number", iban: false, bankCodeLabel: "Bank / branch code", bankCodePlaceholder: "Receiving bank and branch details", bankCodeRequired: true, hint: "Japanese bank, branch and account details; foreign-currency arrival may involve an intermediary bank." },
  { code: "AE", label: "United Arab Emirates", flag: "🇦🇪", currency: "AED", accountLabel: "Recipient IBAN", accountPlaceholder: "AE07 0331 2345 ...", iban: true, hint: "UAE IBAN and receiving bank SWIFT/BIC." },
  { code: "NG", label: "Nigeria", flag: "🇳🇬", currency: "NGN", accountLabel: "Recipient account number", accountPlaceholder: "10-digit receiving account number", iban: false, hint: "Confirm whether the receiving bank can accept international wires in NGN; a USD correspondent route may be required." },
];

export function countryByCode(value: string) {
  return DESTINATION_COUNTRIES.find((country) => country.code === String(value || "").toUpperCase());
}

export function normaliseBankId(value: string) {
  return String(value || "").toUpperCase().replace(/\s+/g, "");
}

export function isValidIbanForCountry(value: string, country: string) {
  const iban = normaliseBankId(value);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban) || !iban.startsWith(country)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const part = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of part) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}
