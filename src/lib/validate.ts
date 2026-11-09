/* Lead-form validation — ported 1:1 from the previous widget so the same inputs are accepted/rejected. */

const DISPOSABLE = new Set(["10minutemail.com", "guerrillamail.com", "mailinator.com", "sharklasers.com", "tempmail.com", "temp-mail.org", "throwawaymail.com", "yopmail.com"]);
const RESERVED = new Set(["example.com", "example.net", "example.org", "invalid.com", "test.com", "test.net", "test.org"]);
const FAKE_LOCAL = new Set(["fake", "no-reply", "noreply", "none", "null", "unknown", "test", "example"]);
const TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com", "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gnail.com": "gmail.com", "gmail.con": "gmail.com",
  "hotmial.com": "hotmail.com", "hotnail.com": "hotmail.com", "hotmail.con": "hotmail.com",
  "outlook.con": "outlook.com", "yaho.com": "yahoo.com", "yahoo.con": "yahoo.com",
};
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export function validateEmail(input: string): { valid: boolean; email: string; message: string } {
  const email = String(input || "").trim().toLowerCase();
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { valid: false, email, message: "Enter a valid email address." };
  const [local, domain] = parts;
  const labels = domain.split(".");
  if (email.length > 254 || local.length > 64) return { valid: false, email, message: "Email address is too long." };
  if (/\s/.test(email) || local.startsWith(".") || local.endsWith(".") || local.includes(".."))
    return { valid: false, email, message: "Enter a valid email address." };
  if (FAKE_LOCAL.has(local) || RESERVED.has(domain)) return { valid: false, email, message: "Please use your real email address." };
  if (DISPOSABLE.has(domain)) return { valid: false, email, message: "Please use a permanent business or personal email address." };
  if (TYPOS[domain]) return { valid: false, email, message: `Did you mean ${local}@${TYPOS[domain]}?` };
  if (labels.length < 2 || labels[labels.length - 1].length < 2 || !/^[a-z]+$/i.test(labels[labels.length - 1]))
    return { valid: false, email, message: "Email domain must include a valid extension." };
  if (labels.some((l) => !LABEL.test(l))) return { valid: false, email, message: "Enter a valid email domain." };
  return { valid: true, email, message: "" };
}

const PLACEHOLDER_WORDS = /\b(demo|dummy|fake|sample|test|testing|unknown|none|null|na|n\/a)\b/i;
const FAKE_NUMBERS = new Set(["0000000", "0000000000", "1111111111", "1231231234", "1234567", "1234567890", "2222222222", "3333333333", "4444444444", "5555555555", "6666666666", "7777777777", "8888888888", "9876543210", "9999999999", "0011223344", "1234512345"]);

export function validatePhone(input: string): { valid: boolean; phone: string; message: string } {
  const phone = String(input || "").trim().replace(/\s+/g, " ");
  if (!phone) return { valid: true, phone: "", message: "" };
  if (PLACEHOLDER_WORDS.test(phone)) return { valid: false, phone, message: "Please use a real phone number." };
  if (!/^\+?[0-9().\-\s]+$/.test(phone)) return { valid: false, phone, message: "Enter a valid phone number." };
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return { valid: false, phone, message: "Phone number is too short." };
  if (digits.length > 15) return { valid: false, phone, message: "Phone number is too long." };
  const sequential = digits.length >= 7 && ("01234567890123456789".includes(digits) || "98765432109876543210".includes(digits));
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  const fictional555 = national.length === 10 && national.slice(3, 6) === "555" && Number(national.slice(6)) >= 100 && Number(national.slice(6)) <= 199;
  if (FAKE_NUMBERS.has(digits) || /^(\d)\1+$/.test(digits) || sequential || fictional555)
    return { valid: false, phone, message: "Please use a real phone number." };
  return { valid: true, phone, message: "" };
}
