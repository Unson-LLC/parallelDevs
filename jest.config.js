module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js'
  ],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};