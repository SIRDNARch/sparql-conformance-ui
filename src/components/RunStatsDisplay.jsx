import { useState } from 'react';
import { normalizeDisplayValue } from '../utils/displayMappings';

function ChevronButton({ expanded, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      title={expanded ? 'Hide suite breakdown' : 'Show suite breakdown'}
    >
      <span>{expanded ? 'Hide suites' : 'Suites'}</span>
      <svg
        className="w-3 h-3 transition-transform"
        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function SuiteTable({ suiteStats }) {
  return (
    <div className="mt-2 overflow-hidden rounded border border-gray-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-1.5 text-left font-medium text-gray-600">Suite</th>
            <th className="px-3 py-1.5 text-right font-medium text-gray-600">Total</th>
            <th className="px-3 py-1.5 text-right font-medium text-green-700">Passed</th>
            <th className="px-3 py-1.5 text-right font-medium text-yellow-700">Intended</th>
            <th className="px-3 py-1.5 text-right font-medium text-red-700">Failed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {suiteStats.map(s => (
            <tr key={s.suite} className="hover:bg-gray-50">
              <td className="px-3 py-1.5 font-medium text-gray-700">{normalizeDisplayValue('suite', s.suite)}</td>
              <td className="px-3 py-1.5 text-right text-gray-700">{s.total}</td>
              <td className="px-3 py-1.5 text-right text-green-700">{s.passed}</td>
              <td className="px-3 py-1.5 text-right text-yellow-700">{s.intended}</td>
              <td className="px-3 py-1.5 text-right text-red-700">{s.failed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RunStatsDisplay({ stats, suiteStats = [], variant = 'inline' }) {
  const [expanded, setExpanded] = useState(false);
  const hasBreakdown = suiteStats.length > 0;

  const toggle = (e) => {
    e.stopPropagation();
    setExpanded(prev => !prev);
  };

  if (variant === 'cards') {
    return (
      <div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-100 text-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm font-medium">Total Tests</div>
          </div>
          <div className="bg-green-100 text-green-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.passed}</div>
            <div className="text-sm font-medium">Passed</div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.intended}</div>
            <div className="text-sm font-medium">Intended Deviation</div>
          </div>
          <div className="bg-red-100 text-red-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.failed}</div>
            <div className="text-sm font-medium">Failed</div>
          </div>
        </div>
        {hasBreakdown && (
          <div className="mt-2 flex justify-end">
            <ChevronButton expanded={expanded} onClick={toggle} />
          </div>
        )}
        {expanded && <SuiteTable suiteStats={suiteStats} />}
      </div>
    );
  }

  if (variant === 'compact-grid') {
    return (
      <div>
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-4 gap-2 text-center flex-1">
            <div>
              <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{stats.passed}</div>
              <div className="text-xs text-gray-600">Passed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">{stats.intended}</div>
              <div className="text-xs text-gray-600">Intended</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>
          {hasBreakdown && <ChevronButton expanded={expanded} onClick={toggle} />}
        </div>
        {expanded && <SuiteTable suiteStats={suiteStats} />}
      </div>
    );
  }

  // inline variant — used in run list pages
  const passRate = stats.total > 0
    ? ((stats.passed / stats.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div>
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <span className="text-gray-600">
          <span className="font-semibold text-green-600">{stats.passed}</span> passed
        </span>
        <span className="text-gray-600">
          <span className="font-semibold text-red-600">{stats.failed}</span> failed
        </span>
        <span className="text-gray-600">
          <span className="font-semibold text-yellow-600">{stats.intended}</span> intended
        </span>
        <span className="text-gray-600">
          <span className="font-semibold">{stats.total}</span> total
        </span>
        <span className={`font-semibold ${
          parseFloat(passRate) >= 80
            ? 'text-green-600'
            : parseFloat(passRate) >= 50
            ? 'text-yellow-600'
            : 'text-red-600'
        }`}>
          {passRate}% pass rate
        </span>
        {hasBreakdown && <ChevronButton expanded={expanded} onClick={toggle} />}
      </div>
      {expanded && <SuiteTable suiteStats={suiteStats} />}
    </div>
  );
}
