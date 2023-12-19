module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: 'standard-jsx',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    totalPrice: 'readonly',
    cartItems: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true,
    },
  },
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'react/jsx-no-bind': [
      'error',
      {
        allowArrowFunctions: true,
        allowBind: false,
        ignoreRefs: true,
      },
    ],
    'react/react-in-jsx-scope': 'error',
    'jsx-quotes': ['error', 'prefer-double'],
  },
  plugins: ['react'],
}
