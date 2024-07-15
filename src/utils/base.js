// balance the numbers and the letters
const characters = '0123456789ABCDEFGHIJKLMN0123456789OPQRSTUVWXYZ0123456789';

export const generateCode = (length) => {
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
};
