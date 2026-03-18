import pkg from '../package.json';

test('package.json has test script', () => {
  expect(pkg.scripts && pkg.scripts.test).toBeTruthy();
});
