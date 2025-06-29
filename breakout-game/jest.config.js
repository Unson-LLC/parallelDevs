export default {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  transform: {},
  testEnvironmentOptions: {
    experimentalImportMetaResolve: true
  }
};