/**
 * Shared helper to calculate test statistics from results JSON.
 *
 * Keeps upload/import paths aligned and supports legacy status variants.
 */
export function calculateTestStats(resultsJson) {
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    intended: 0,
    skipped: 0,
  };

  for (const [key, test] of Object.entries(resultsJson || {})) {
    if (key === 'info' || !test || typeof test !== 'object' || Array.isArray(test)) {
      continue;
    }

    const status = String(test.status || '').toLowerCase().trim();
    if (!status) {
      continue;
    }

    stats.total += 1;

    const errorType = String(test.errorType || '').toLowerCase();
    const isIntended = (
      status === 'intended' ||
      status === 'failed: intended' ||
      errorType.includes('intended') ||
      test.intended === true
    );

    if (status === 'passed' || status === 'pass') {
      stats.passed += 1;
    } else if (status === 'skipped' || status === 'skip') {
      stats.skipped += 1;
    } else if (status === 'failed' || status === 'fail' || status === 'failed: intended' || status === 'intended') {
      if (isIntended) {
        stats.intended += 1;
      } else {
        stats.failed += 1;
      }
    }
  }

  return stats;
}
