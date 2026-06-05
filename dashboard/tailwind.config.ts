import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        solana: {
          gradient: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
          purple: '#9945FF',
          green: '#14F195',
        },
      },
    },
  },
  plugins: [],
}

export default config
