/**
 * GitHub Comment Builder
 * 
 * Generates markdown content for GitHub PR comments and check run summaries.
 */

const STATUS_TRANSITIONS = {
  pToF: ['Passed', 'Failed'],
  pToI: ['Passed', 'Intended'],
  pToN: ['Passed', 'Not Tested'],
  fToP: ['Failed', 'Passed'],
  fToI: ['Failed', 'Intended'],
  fToN: ['Failed', 'Not Tested'],
  iToP: ['Intended', 'Passed'],
  iToF: ['Intended', 'Failed'],
  iToN: ['Intended', 'Not Tested'],
  nToP: ['Not Tested', 'Passed'],
  nToF: ['Not Tested', 'Failed'],
  nToI: ['Not Tested', 'Intended'],
  addedN: ['-', 'Not Tested'],
  addedP: ['-', 'Passed'],
  addedI: ['-', 'Intended'],
  addedF: ['-', 'Failed'],
  deleted: ['Deleted', '-']
};

/**
 * Generate a markdown table summarizing test status changes
 * 
 * @param {Object} comparison - Result from compareTestRuns()
 * @returns {string} Markdown table
 */
function generateChangesTable(comparison) {
  let table = `
#### SPARQL 1.1 Test Status Changes 📊

| Number of Tests | Previous Status | Current Status |
| --------------- | --------------- | -------------- |
`;

  for (const [key, [prevStatus, currentStatus]] of Object.entries(STATUS_TRANSITIONS)) {
    const tests = comparison[key];
    if (tests && tests.length > 0) {
      table += `| ${tests.length} | ${prevStatus} | ${currentStatus} |\n`;
    }
  }

  return table + '\n';
}

/**
 * Generate the overview statistics table
 *
 * @param {Object} comparison - Result from compareTestRuns() for sparql11
 * @param {Array} suiteStats - Per-suite stats from calculateSuiteStats()
 * @returns {string} Markdown table
 */
function generateOverviewTable(comparison, suiteStats) {
  if (!suiteStats || suiteStats.length === 0) {
    return `
### Overview
| Suite | Total | Passed ✅ | Intended ✅ | Failed ❌ | Not Tested |
| ----- | ----- | --------- | ---------- | -------- | ---------- |
| sparql11 | ${comparison.total} | ${comparison.p} | ${comparison.i} | ${comparison.f} | ${comparison.n} |

`;
  }

  let table = `
### Overview
| Suite | Total | Passed ✅ | Intended ✅ | Failed ❌ | Not Tested |
| ----- | ----- | --------- | ---------- | -------- | ---------- |
`;

  let grandTotal = 0, grandPassed = 0, grandIntended = 0, grandFailed = 0;

  for (const s of suiteStats) {
    const notTested = s.total - s.passed - s.intended - s.failed;
    table += `| ${s.suite} | ${s.total} | ${s.passed} | ${s.intended} | ${s.failed} | ${notTested} |\n`;
    grandTotal += s.total;
    grandPassed += s.passed;
    grandIntended += s.intended;
    grandFailed += s.failed;
  }

  if (suiteStats.length > 1) {
    const grandNotTested = grandTotal - grandPassed - grandIntended - grandFailed;
    table += `| **Total** | **${grandTotal}** | **${grandPassed}** | **${grandIntended}** | **${grandFailed}** | **${grandNotTested}** |\n`;
  }

  return table + '\n';
}

/**
 * Generate the pass/fail verdict section
 * 
 * @param {Object} comparison - Result from compareTestRuns()
 * @returns {{ markdown: string, summary: string }}
 */
function generateVerdict(comparison) {
  if (comparison.isMergeable) {
    return {
      markdown: '### Conformance check passed ✅\n\n',
      summary: 'Conformance check passed ✅'
    };
  } else {
    const regressionCount = comparison.regressionCount || 
      (comparison.pToF?.length || 0) + (comparison.iToF?.length || 0);
    
    return {
      markdown: `### Conformance check failed ❌\n\nFound ${regressionCount} regression(s).\n\n`,
      summary: 'Conformance check failed ❌'
    };
  }
}

/**
 * Generate a link to the details website
 * 
 * @param {string} websiteUrl - Base URL to the conformance website
 * @param {number|string|null} currentRunId - Current run ID
 * @param {number|string|null} previousRunId - Previous/baseline run ID
 * @returns {string} Markdown link
 */
function generateDetailsLink(websiteUrl, currentRunId, previousRunId) {
  const base = websiteUrl.replace(/\/$/, '');

  let url = base;
  if (currentRunId && previousRunId) {
    url = `${base}/compare/${encodeURIComponent(String(currentRunId))}/${encodeURIComponent(String(previousRunId))}`;
  } else if (currentRunId) {
    url = `${base}/run/${encodeURIComponent(String(currentRunId))}`;
  }

  return `\n📋 **Details:** [View full comparison](${url})\n`;
}

/**
 * Build the full PR comment body and summary
 * 
 * @param {Object} comparison - Result from compareTestRuns()
 * @param {string} websiteUrl - URL to the conformance website
 * @param {number|string|null} currentRunId - Current run ID
 * @param {number|string|null} previousRunId - Previous/master run ID
 * @returns {{ body: string, summary: string }}
 */
export function buildCommentBody(comparison, websiteUrl, currentRunId, previousRunId, suiteStats = []) {
  let body = '';

  body += generateOverviewTable(comparison, suiteStats);

  const verdict = generateVerdict(comparison);
  body += verdict.markdown;

  if (comparison.hasChanges) {
    body += generateChangesTable(comparison);
  } else {
    body += 'No test result changes.\n\n';
  }

  body += generateDetailsLink(websiteUrl, currentRunId, previousRunId);

  return {
    body,
    summary: verdict.summary
  };
}
