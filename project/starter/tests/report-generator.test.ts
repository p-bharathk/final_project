import { describe, it, expect } from 'vitest';
import { ReportGenerator } from '../src/utils/report-generator.js';
import { ReviewReport } from '../src/types/report-types.js';

describe('ReportGenerator - No Undefined Placeholders', () => {
  const reportGenerator = new ReportGenerator();

  // Create a comprehensive test report with real data
  const createTestReport = (overrides: Partial<ReviewReport> = {}): ReviewReport => ({
    pullRequest: {
      owner: 'testuser',
      repo: 'test-repo',
      number: 1
    },
    fileReviews: [
      {
        file: 'src/index.ts',
        codeQuality: {
          file: 'src/index.ts',
          issues: [
            {
              line: 42,
              severity: 'high',
              category: 'security',
              description: 'Potential SQL injection vulnerability',
              suggestion: 'Use parameterized queries'
            },
            {
              line: 65,
              severity: 'medium',
              category: 'performance',
              // Test field name variation - message instead of description
              message: 'Inefficient loop detected',
              suggestion: 'Consider using map instead of for loop'
            }
          ],
          overallScore: 72,
          summary: 'Code has security concerns that need addressing'
        },
        testCoverage: {
          file: 'src/index.ts',
          hasTests: true,
          testFiles: ['src/index.test.ts'],
          untestedPaths: [
            {
              type: 'function',
              location: 'validateUser at line 48',
              priority: 'HIGH',  // Test uppercase priority
              reasoning: 'Critical business logic must be tested',
              suggestedTest: 'test("should validate user correctly", () => { ... })'
            },
            {
              type: 'branch',
              location: 'error handling at line 72',
              priority: 'medium',
              reasoning: 'Error paths need coverage',
              suggestedTest: 'test("should handle validation errors", () => { ... })'
            }
          ],
          coverageEstimate: 68,
          summary: 'Missing coverage for critical paths'
        },
        refactorings: {
          file: 'src/index.ts',
          suggestions: [
            {
              type: 'extract-function',
              location: 'validateAndSave at lines 40-75',
              impact: 'high',
              description: 'Extract validation logic into separate function',
              before: 'function validateAndSave(user) {\n  if (!user.email) throw ...\n  if (!user.name) throw ...\n  db.save(user)\n}',
              after: 'function validate(user) { ... }\nfunction validateAndSave(user) {\n  validate(user)\n  db.save(user)\n}'  ,
              benefits: 'Improves testability and code reusability'
            }
          ],
          summary: 'One major refactoring opportunity identified'
        }
      },
      {
        file: 'src/utils.ts',
        codeQuality: {
          file: 'src/utils.ts',
          issues: [],
          overallScore: 85,
          summary: 'No quality issues found'
        },
        testCoverage: {
          file: 'src/utils.ts',
          hasTests: true,
          testFiles: ['src/utils.test.ts'],
          untestedPaths: [],
          coverageEstimate: 95,
          summary: 'Well tested utility functions'
        },
        refactorings: {
          file: 'src/utils.ts',
          suggestions: [],
          summary: 'Code is well structured'
        }
      }
    ],
    summary: {
      totalFiles: 2,
      overallScore: 78,
      criticalIssues: 1,
      highPriorityTests: 1,
      refactoringOpportunities: 1
    },
    recommendations: [
      {
        priority: 'CRITICAL',  // Test uppercase priority
        category: 'security',
        description: 'Fix SQL injection vulnerability in user validation',
        files: ['src/index.ts']
      },
      {
        priority: 'high',
        category: 'testing',
        description: 'Add tests for validateUser function',
        files: ['src/index.ts']
      },
      {
        priority: 'medium',
        category: 'refactoring',
        description: 'Extract validation logic into separate function',
        files: ['src/index.ts']
      }
    ],
    metadata: {
      analyzedAt: new Date().toISOString(),
      duration: 5423,  // Test real duration
      agentVersions: { orchestrator: '1.0.0' }
    },
    ...overrides
  });

  describe('Markdown Report Generation', () => {
    it('should generate markdown without undefined placeholders', () => {
      const report = createTestReport();
      const markdown = reportGenerator.generateMarkdownReport(report);

      // Check for undefined strings (the core issue from Work/Updates)
      expect(markdown).not.toContain('undefined');
      expect(markdown).not.toContain('NaN');
      expect(markdown).not.toContain('null');

      // Verify real data is present
      expect(markdown).toContain('src/index.ts');
      expect(markdown).toContain('SQL injection');
      expect(markdown).toContain('72/100');
      expect(markdown).toContain('68%');
    });

    it('should normalize priority values correctly', () => {
      const report = createTestReport();
      const markdown = reportGenerator.generateMarkdownReport(report);

      // Should handle UPPERCASE priority like "CRITICAL" and "HIGH"
      expect(markdown).toContain('🚨');  // critical emoji
      expect(markdown).toContain('⚠️');  // high emoji
      expect(markdown).toContain('📝');  // medium emoji

      // Should NOT contain raw uppercase
      const lines = markdown.split('\n');
      lines.forEach(line => {
        if (line.includes('**')) {
          expect(line).not.toMatch(/\[CRITICAL\]/i);
          expect(line).not.toMatch(/\[HIGH\]/i);
        }
      });
    });

    it('should handle missing issue descriptions', () => {
      const report = createTestReport({
        fileReviews: [{
          file: 'src/test.ts',
          codeQuality: {
            file: 'src/test.ts',
            issues: [
              {
                line: 10,
                severity: 'low',
                category: 'style',
                // No description, message, issue, or title field
                suggestion: 'Improve style'
              } as any
            ],
            overallScore: 80,
            summary: 'Test'
          },
          testCoverage: {
            file: 'src/test.ts',
            hasTests: false,
            testFiles: [],
            untestedPaths: [],
            coverageEstimate: 0,
            summary: 'No tests'
          },
          refactorings: {
            file: 'src/test.ts',
            suggestions: [],
            summary: 'Test'
          }
        }]
      });

      const markdown = reportGenerator.generateMarkdownReport(report);

      // Should use fallback text instead of undefined
      expect(markdown).toContain('No issue description provided');
      expect(markdown).not.toContain('undefined');
    });

    it('should include real line numbers', () => {
      const report = createTestReport();
      const markdown = reportGenerator.generateMarkdownReport(report);

      // Verify line numbers from actual issues are present
      expect(markdown).toContain('Line 42');
      expect(markdown).toContain('Line 65');
    });

    it('should include duration with correct unit', () => {
      const report = createTestReport();
      const markdown = reportGenerator.generateMarkdownReport(report);

      // Should include duration in milliseconds
      expect(markdown).toContain('5423ms');
      expect(markdown).not.toContain('undefinedms');
    });
  });

  describe('HTML Report Generation', () => {
    it('should generate HTML without undefined placeholders', () => {
      const report = createTestReport();
      const html = reportGenerator.generateHTMLReport(report);

      // Check for undefined strings
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
      expect(html).not.toContain('null');

      // Verify HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Code Review Report');
      expect(html).toContain('72');  // overall score from first file
      expect(html).toContain('78');  // overall summary score
    });

    it('should normalize priority in CSS classes', () => {
      const report = createTestReport();
      const html = reportGenerator.generateHTMLReport(report);

      // Should create valid CSS classes
      expect(html).toContain('rec-critical');
      expect(html).toContain('rec-high');
      expect(html).toContain('rec-medium');

      // Should NOT have uppercase in class names
      expect(html).not.toContain('rec-CRITICAL');
      expect(html).not.toContain('rec-HIGH');
    });

    it('should include duration in footer', () => {
      const report = createTestReport();
      const html = reportGenerator.generateHTMLReport(report);

      // Should include duration correctly
      expect(html).toContain('5423ms');
      expect(html).not.toContain('undefinedms');
    });

    it('should include all metric values', () => {
      const report = createTestReport();
      const html = reportGenerator.generateHTMLReport(report);

      // Verify metrics are displayed (from summary)
      expect(html).toContain('78');  // overall score
      expect(html).toContain('2');   // files reviewed
      expect(html).toContain('1');   // critical issues
      expect(html).toContain('1');   // tests needed
      expect(html).toContain('1');   // refactorings
    });
  });

  describe('JSON Report Generation', () => {
    it('should generate valid JSON', () => {
      const report = createTestReport();
      const json = reportGenerator.generateJSONReport(report);

      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.pullRequest.owner).toBe('testuser');
      expect(parsed.summary.overallScore).toBe(78);
    });

    it('should preserve all data fields', () => {
      const report = createTestReport();
      const json = reportGenerator.generateJSONReport(report);
      const parsed = JSON.parse(json);

      // Verify critical data is preserved
      expect(parsed.fileReviews).toHaveLength(2);
      expect(parsed.fileReviews[0].codeQuality.issues).toHaveLength(2);
      expect(parsed.fileReviews[0].testCoverage.untestedPaths).toHaveLength(2);
      expect(parsed.recommendations).toHaveLength(3);
    });
  });

  describe('Field Normalization - Priority Variations', () => {
    it('should handle lowercase priority', () => {
      const report = createTestReport({
        recommendations: [
          {
            priority: 'low' as any,
            category: 'test',
            description: 'Test',
            files: []
          }
        ]
      });

      const markdown = reportGenerator.generateMarkdownReport(report);
      const html = reportGenerator.generateHTMLReport(report);

      expect(markdown).not.toContain('undefined');
      expect(html).not.toContain('undefined');
    });

    it('should handle uppercase priority', () => {
      const report = createTestReport({
        recommendations: [
          {
            priority: 'CRITICAL' as any,
            category: 'test',
            description: 'Test',
            files: []
          }
        ]
      });

      const markdown = reportGenerator.generateMarkdownReport(report);
      const html = reportGenerator.generateHTMLReport(report);

      expect(markdown).not.toContain('undefined');
      expect(html).not.toContain('undefined');
    });
  });

  describe('Field Normalization - Duration Variations', () => {
    it('should handle duration in milliseconds', () => {
      const report = createTestReport({
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 5000,
          agentVersions: {}
        }
      });

      const markdown = reportGenerator.generateMarkdownReport(report);
      expect(markdown).toContain('5000ms');
      expect(markdown).not.toContain('undefinedms');
    });

    it('should handle duration_seconds', () => {
      const report = createTestReport({
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration_seconds: 5,  // 5 seconds
          agentVersions: {}
        } as any
      });

      const markdown = reportGenerator.generateMarkdownReport(report);
      expect(markdown).toContain('5000ms');  // Should convert to milliseconds
      expect(markdown).not.toContain('undefinedms');
    });

    it('should handle missing duration', () => {
      const report = createTestReport({
        metadata: {
          analyzedAt: new Date().toISOString(),
          agentVersions: {}
        } as any
      });

      const markdown = reportGenerator.generateMarkdownReport(report);
      expect(markdown).toContain('0ms');
      expect(markdown).not.toContain('undefinedms');
    });
  });

  describe('Real-World Scenario - Mixed Field Names', () => {
    it('should handle report with mixed field name variations', () => {
      const report = createTestReport();
      const markdown = reportGenerator.generateMarkdownReport(report);
      const html = reportGenerator.generateHTMLReport(report);

      // Both should be generated without errors
      expect(markdown.length).toBeGreaterThan(0);
      expect(html.length).toBeGreaterThan(0);

      // Both should be free of undefined
      expect(markdown).not.toContain('undefined');
      expect(html).not.toContain('undefined');

      // Both should contain real data
      expect(markdown).toContain('src/index.ts');
      expect(html).toContain('78');
    });
  });
});
