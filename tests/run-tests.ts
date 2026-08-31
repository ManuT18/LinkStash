import { startTestServer, stopTestServer } from './helpers/test-server';
import { runTier1Tests } from './tier1-feature-coverage.test';
import { runTier2Tests } from './tier2-boundary-corner.test';
import { runTier3Tests } from './tier3-cross-feature.test';
import { runTier4Tests } from './tier4-scenarios.test';

async function main() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('🚀 LinkStash E2E Opaque-Box Test Suite Runner');
  console.log('====================================================');

  let totalPassed = 0;
  let totalFailed = 0;

  try {
    console.log('\n[1/5] Starting Isolated Express Test Server...');
    await startTestServer();
    console.log('✓ Isolated Test Server online at http://localhost:3999 (DB: data/test_linkstash.db)');

    // Run Tier 1
    console.log('\n[2/5] Running Tier 1: Feature Coverage Suites...');
    const t1 = await runTier1Tests();
    totalPassed += t1.passed;
    totalFailed += t1.failed;

    // Run Tier 2
    console.log('\n[3/5] Running Tier 2: Boundary & Corner Cases Suites...');
    const t2 = await runTier2Tests();
    totalPassed += t2.passed;
    totalFailed += t2.failed;

    // Run Tier 3
    console.log('\n[4/5] Running Tier 3: Cross-Feature Combinations Suites...');
    const t3 = await runTier3Tests();
    totalPassed += t3.passed;
    totalFailed += t3.failed;

    // Run Tier 4
    console.log('\n[5/5] Running Tier 4: Real-World Scenarios Suites...');
    const t4 = await runTier4Tests();
    totalPassed += t4.passed;
    totalFailed += t4.failed;

  } catch (err: any) {
    console.error('\n💥 Critical Error executing E2E Test Suite:', err);
    totalFailed++;
  } finally {
    console.log('\n[Teardown] Stopping Test Server and cleaning database...');
    await stopTestServer();
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n====================================================');
  console.log('📊 E2E TEST SUITE EXECUTION SUMMARY');
  console.log('====================================================');
  console.log(`Total Test Cases Executed : ${totalPassed + totalFailed}`);
  console.log(`Passed                    : ${totalPassed} ✓`);
  console.log(`Failed                    : ${totalFailed} ✗`);
  console.log(`Duration                  : ${duration}s`);
  console.log('====================================================');

  if (totalFailed > 0) {
    console.error(`❌ TEST SUITE FAILED with ${totalFailed} failure(s).`);
    process.exit(1);
  } else {
    console.log('✅ ALL TEST SUITES PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

main();
