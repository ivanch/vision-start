/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'w-[24px]', 'h-[24px]',
    'w-[28px]', 'h-[28px]',
    'w-[32px]', 'h-[32px]',
    'w-[34px]', 'h-[34px]',
    'w-[36px]', 'h-[36px]',
    'w-[40px]', 'h-[40px]',
    'w-[42px]', 'h-[42px]',
    'w-[48px]', 'h-[48px]',
    // add any other sizes you use
  ],
}