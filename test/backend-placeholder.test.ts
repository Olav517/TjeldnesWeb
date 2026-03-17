const pkg = require('../package.json');

test('package.json has test script', () => {
  expect(pkg.scripts && pkg.scripts.test).toBeTruthy();
});
