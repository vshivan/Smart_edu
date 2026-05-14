/**
 * Jest global setup — runs once before all test suites
 * Wakes the Render server if testing remotely
 */
const { wakeServer } = require('./setup');

module.exports = async () => {
  await wakeServer();
};
