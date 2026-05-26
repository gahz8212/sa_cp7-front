import eslintConfig from "@cp7/config/eslint/next.mjs"

const config = [
  ...eslintConfig,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]

export default config
