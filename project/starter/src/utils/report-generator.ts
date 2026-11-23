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
   * Normalize priority values - handles uppercase, lowercase, and missing values
   */
  private normalizePriority(priority: unknown): 'critical' | 'high' | 'medium' | 'low' {
    const value = String(priority ?? 'low').toLowerCase();
    return ['critical', 'high', 'medium', 'low'].includes(value)
      ? (value as 'critical' | 'high' | 'medium' | 'low')
      : 'low';
  }

  /**
   * Extract issue description from various field names
   */
  private issueText(issue: any): string {
    return issue.description ?? issue.message ?? issue.issue ?? issue.title ?? 'No issue description provided';
  }

  /**
   * Extract duration in milliseconds, handling different field formats
   */
  private durationMs(metadata: any): number {
    if (typeof metadata?.duration === 'number') return metadata.duration;
    if (typeof metadata?.duration_seconds === 'number') return metadata.duration_seconds * 1000;
    return 0;
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
      const normalizedPriority = this.normalizePriority(rec.priority);
      const emoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '📝',
        low: '💡'
      }[normalizedPriority];

      return `${idx + 1}. ${emoji} **${rec.category}**: ${rec.description}
   - Files: ${rec.files.join(', ')}`;
    }).join('\n\n');

    const formattedFiles = fileReviews.map(review => {
      const { file, codeQuality, testCoverage, refactorings } = review;

      // Ensure issues is always an array
      const issues = Array.isArray(codeQuality?.issues) ? codeQuality.issues : [];
      const issueList = issues.slice(0, 3)
        .map((i: any) => `  - Line ${i.line ?? i.lineNumber ?? 'N/A'}: \`${i.severity ?? 'unknown'}\` ${this.issueText(i)}`)
        .join('\n');

      // Ensure untestedPaths is always an array (handle both schema names and actual data names)
      const untestedPaths = Array.isArray(testCoverage?.untestedPaths) ? testCoverage.untestedPaths :
                           (Array.isArray((testCoverage as any)?.uncoveredScenarios) ? (testCoverage as any).uncoveredScenarios : []);
      const testList = untestedPaths.slice(0, 2)
        .map((p: any) => `  - \`${p.location ?? p.functionName ?? 'unknown'}\` (${this.normalizePriority(p.priority ?? p.criticality ?? 'low')} priority)`)
        .join('\n');

      // Ensure suggestions is always an array (handle both schema names and actual data names)
      const suggestions = Array.isArray(refactorings?.suggestions) ? refactorings.suggestions :
                         (Array.isArray((refactorings as any)?.opportunities) ? (refactorings as any).opportunities : []);
      const refactorList = suggestions.slice(0, 2)
        .map((s: any) => `  - **${s.type ?? 'unknown'}**: ${s.description ?? s.suggestion ?? 'No description'}`)
        .join('\n');

      const qualityScore = (codeQuality?.overallScore ?? (codeQuality as any)?.score) || 'N/A';
      const coverageEstimate = (testCoverage?.coverageEstimate ?? (testCoverage as any)?.estimatedCoverage) || 'N/A';

      return `### 📄 \`${file}\`

**Quality Score:** ${qualityScore}/100 | **Coverage:** ~${coverageEstimate}%

#### Issues (${issues.length})
${issueList || '  None found'}
${issues.length > 3 ? `\n  *...and ${issues.length - 3} more*` : ''}

#### Test Gaps (${untestedPaths.length})
${testList || '  None found'}
${untestedPaths.length > 2 ? `\n  *...and ${untestedPaths.length - 2} more*` : ''}

#### Refactoring Opportunities (${suggestions.length})
${refactorList || '  None found'}
${suggestions.length > 2 ? `\n  *...and ${suggestions.length - 2} more*` : ''}`;
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

*Generated at ${report.metadata.analyzedAt} • Duration: ${this.durationMs(report.metadata)}ms*
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

    const recList = recommendations.slice(0, 5).map(r => {
      const normalizedPriority = this.normalizePriority(r.priority);
      return `
      <li class="rec-${normalizedPriority}">
        <span class="priority">[${normalizedPriority.toUpperCase()}]</span>
        <strong>${r.category}</strong>: ${r.description}
        <br><small>Files: ${r.files.join(', ')}</small>
      </li>
    `;
    }).join('');

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
    Generated at ${metadata.analyzedAt} • Duration: ${this.durationMs(metadata)}ms
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
