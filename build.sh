yarn test

rm -rf dist
tsc -p .
rm -fr dist/__tests__
