import { ReviewReport } from '../types/report-types';

/**
 * Report Generator
 * Converts ReviewReport to various output formats (Markdown, HTML, JSON)
 */
export class ReportGenerator {
  /**
   * Extract metric value from summary (handles both flat and nested structures)
   */
  private getMetricValue(summary: any, ...keys: string[]): number {
    let value = summary;
    for (const key of keys) {
      value = value?.[key];
    }
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Generate a Markdown report for PR comments
   */
  generateMarkdownReport(report: ReviewReport): string {
    const { summary, recommendations, fileReviews } = report;

    // Extract metrics from both flat and nested structures
    const criticalIssues = (summary as any)?.criticalIssues ??
                          (summary as any)?.codeQualityMetrics?.criticalIssues ?? 0;
    const highPriorityTests = (summary as any)?.highPriorityTests ??
                             (summary as any)?.testingMetrics?.highPriorityTests ?? 0;
    const refactoringOpportunities = (summary as any)?.refactoringOpportunities ??
                                    (summary as any)?.refactoringMetrics?.refactoringOpportunities ?? 0;

    const formattedRecs = recommendations.slice(0, 5).map((rec, idx) => {
      const emoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '📝',
        low: '💡'
      }[rec.priority];

      return `${idx + 1}. ${emoji} **${rec.category}**: ${rec.description}
   - Files: ${rec.files.join(', ')}`;
    }).join('\n\n');

    const formattedFiles = fileReviews.map(review => {
      const { file, codeQuality, testCoverage, refactorings } = review;

      const issueList = (codeQuality?.issues || []).slice(0, 3)
        .map((i: any) => `  - Line ${i.line}: \`${i.severity}\` ${i.description}`)
        .join('\n');

      const testList = (testCoverage?.untestedPaths || []).slice(0, 2)
        .map((p: any) => `  - \`${p.location}\` (${p.priority} priority)`)
        .join('\n');

      const refactorList = (refactorings?.suggestions || []).slice(0, 2)
        .map((s: any) => `  - **${s.type}**: ${s.description}`)
        .join('\n');

      return `### 📄 \`${file}\`

**Quality Score:** ${codeQuality?.overallScore || 'N/A'}/100 | **Coverage:** ~${testCoverage?.coverageEstimate || 'N/A'}%

#### Issues (${(codeQuality?.issues || []).length})
${issueList || '  None found'}
${(codeQuality?.issues?.length || 0) > 3 ? `\n  *...and ${(codeQuality?.issues?.length || 0) - 3} more*` : ''}

#### Test Gaps (${(testCoverage?.untestedPaths || []).length})
${testList || '  None found'}
${(testCoverage?.untestedPaths?.length || 0) > 2 ? `\n  *...and ${(testCoverage?.untestedPaths?.length || 0) - 2} more*` : ''}

#### Refactoring Opportunities (${(refactorings?.suggestions || []).length})
${refactorList || '  None found'}
${(refactorings?.suggestions?.length || 0) > 2 ? `\n  *...and ${(refactorings?.suggestions?.length || 0) - 2} more*` : ''}`;
    }).join('\n\n---\n\n');

    return `# 🔍 Code Review Report

## Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | ${(summary as any)?.overallScore || 'N/A'}/100 |
| **Files Reviewed** | ${(summary as any)?.totalFiles || 'N/A'} |
| **Critical Issues** | ${criticalIssues} |
| **High Priority Tests** | ${highPriorityTests} |
| **Refactoring Opportunities** | ${refactoringOpportunities} |

## 🎯 Top Recommendations

${formattedRecs || 'No recommendations at this time.'}

## 📁 File Details

${formattedFiles}

---

*Generated at ${report.metadata.analyzedAt} • Duration: ${report.metadata.duration}ms*
`;
  }

  /**
   * Generate an HTML report for web display
   */
  generateHTMLReport(report: ReviewReport): string {
    const { summary, recommendations, metadata } = report;

    // Extract metrics from both flat and nested structures
    const criticalIssues = (summary as any)?.criticalIssues ??
                          (summary as any)?.codeQualityMetrics?.criticalIssues ?? 0;
    const highPriorityTests = (summary as any)?.highPriorityTests ??
                             (summary as any)?.testingMetrics?.highPriorityTests ?? 0;
    const refactoringOpportunities = (summary as any)?.refactoringOpportunities ??
                                    (summary as any)?.refactoringMetrics?.refactoringOpportunities ?? 0;

    const recList = recommendations.slice(0, 5).map(r => `
      <li class="rec-${r.priority}">
        <span class="priority">[${r.priority.toUpperCase()}]</span>
        <strong>${r.category}</strong>: ${r.description}
        <br><small>Files: ${r.files.join(', ')}</small>
      </li>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Review Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
      background: #f8f9fa;
      color: #212529;
    }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 12px; }
    .summary {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 24px 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }
    .metric { text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; color: #3498db; }
    .metric-label { color: #6c757d; font-size: 0.9em; }
    ul { list-style: none; padding: 0; }
    li { padding: 12px; margin: 8px 0; border-radius: 4px; background: white; }
    .rec-critical { border-left: 4px solid #e74c3c; }
    .rec-high { border-left: 4px solid #f39c12; }
    .rec-medium { border-left: 4px solid #3498db; }
    .rec-low { border-left: 4px solid #27ae60; }
    .priority { font-weight: bold; margin-right: 8px; }
    .rec-critical .priority { color: #e74c3c; }
    .rec-high .priority { color: #f39c12; }
    .rec-medium .priority { color: #3498db; }
    .rec-low .priority { color: #27ae60; }
    footer { text-align: center; color: #6c757d; margin-top: 32px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>🔍 Code Review Report</h1>
  
  <div class="summary">
    <div class="metric">
      <div class="metric-value">${(summary as any)?.overallScore || 'N/A'}</div>
      <div class="metric-label">Overall Score</div>
    </div>
    <div class="metric">
      <div class="metric-value">${(summary as any)?.totalFiles || 'N/A'}</div>
      <div class="metric-label">Files Reviewed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${criticalIssues}</div>
      <div class="metric-label">Critical Issues</div>
    </div>
    <div class="metric">
      <div class="metric-value">${highPriorityTests}</div>
      <div class="metric-label">Tests Needed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${refactoringOpportunities}</div>
      <div class="metric-label">Refactorings</div>
    </div>
  </div>

  <h2>🎯 Top Recommendations</h2>
  <ul>${recList || '<li>No recommendations at this time.</li>'}</ul>

  <footer>
    Generated at ${metadata.analyzedAt} • Duration: ${metadata.duration}ms
  </footer>
</body>
</html>`;
  }

  /**
   * Generate formatted JSON report
   */
  generateJSONReport(report: ReviewReport): string {
    return JSON.stringify(report, null, 2);
  }
}
