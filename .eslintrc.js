module.exports = {
  'env': {
    'es6': true,
    'node': true
  },
  'extends': [
    'airbnb-base',
    'plugin:@typescript-eslint/eslint-recommended'
  ],
  'parser': '@typescript-eslint/parser',
  'plugins': [
    '@typescript-eslint'
  ],
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.ts'],
        'moduleDirectory': ['node_modules', 'src/']
      }
    }
  },
  'rules': {
    'guard-for-in': 0,
    'no-restricted-syntax': 0,
    'no-await-in-loop': 0,
    'dot-notation': 0,
    'import/no-unresolved': 0,
    'no-underscore-dangle': 0,
    'max-classes-per-file': 0,
    'no-unused-vars': 0,
    'camelcase': 0,
    'class-methods-use-this': 0,
    'import/extensions': [0, 'ignorePackages'],
  }
};
