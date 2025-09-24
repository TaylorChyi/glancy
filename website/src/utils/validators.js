const EMAIL_REGEX = /.+@.+\..+/;
const PHONE_REGEX = /^\+?\d{6,15}$/;

export function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function validatePhone(phone) {
  return PHONE_REGEX.test(phone);
}

export function validateAccount(account, method) {
  if (method === "email") return validateEmail(account);
  if (method === "phone") return validatePhone(account);
  return true;
}
