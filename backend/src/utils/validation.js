const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

function validateUser({ name, email, address, password }) {
  if (!name || name.length < 20 || name.length > 60) return "Name must be 20-60 characters";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
  if (!address || address.length > 400) return "Address is required and must be at most 400 characters";
  if (!password || !passwordRegex.test(password)) return "Password must be 8-16 characters with one uppercase and one special character";
  return null;
}
module.exports = { validateUser, passwordRegex };
