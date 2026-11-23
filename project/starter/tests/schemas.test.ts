import { describe, it, expect } from 'vitest';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  ReviewReportSchema
} from '../src/types/index.js';

describe('Schema Validation Tests', () => {
  describe('CodeQualityResultSchema', () => {
    it('should accept valid code quality data', () => {
      const validData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 42,
            severity: 'high' as const,
            category: 'security' as const,
            description: 'SQL injection vulnerability',
            suggestion: 'Use parameterized queries'
          }
        ],
        overallScore: 75,
        summary: 'Found security issues'
      };

      const result = CodeQualityResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        file: 'src/example.ts',
        issues: [
          {
            line: 42,
            severity: 'invalid',
            category: 'security',
            description: 'Test',
            suggestion: 'Fix it'
          }
        ],
        overallScore: 75,
        summary: 'Test'
      };

      const result = CodeQualityResultSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('TestCoverageResultSchema', () => {
    it('should accept valid test coverage data', () => {
      const validData = {
        file: 'src/example.ts',
        hasTests: true,
        testFiles: ['src/example.test.ts'],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'calculateTotal at line 10',
            priority: 'high' as const,
            reasoning: 'Business logic',
            suggestedTest: 'describe("calculateTotal", () => { ... })'
          }
        ],
        coverageEstimate: 65,
        summary: 'Missing tests for edge cases'
      };

      const result = TestCoverageResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty untested paths', () => {
      const validData = {
        file: 'src/example.ts',
        hasTests: true,
        testFiles: ['src/example.test.ts'],
        untestedPaths: [],
        coverageEstimate: 100,
        summary: 'Full coverage'
      };

      const result = TestCoverageResultSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('RefactoringSuggestionSchema', () => {
    it('should accept valid refactoring data', () => {
      const validData = {
        file: 'src/example.ts',
        suggestions: [
          {
            type: 'extract-function' as const,
            location: 'processData at lines 20-50',
            impact: 'high' as const,
            description: 'Extract validation logic',
            before: 'function processData(x) { ... validate ... process ... }',
            after: 'function validate(x) { ... }\nfunction processData(x) { validate(x); process(x); }',
            benefits: 'Better readability and reusability'
          }
        ],
        summary: 'Several refactoring opportunities'
      };

      const result = RefactoringSuggestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty suggestions', () => {
      const validData = {
        file: 'src/example.ts',
        suggestions: [],
        summary: 'No refactorings needed'
      };

      const result = RefactoringSuggestionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('ReviewReportSchema', () => {
    it('should accept valid review report', () => {
      const validData = {
        pullRequest: {
          owner: 'octocat',
          repo: 'Hello-World',
          number: 1
        },
        fileReviews: [
          {
            file: 'src/main.ts',
            codeQuality: {
              file: 'src/main.ts',
              issues: [],
              overallScore: 85,
              summary: 'Good code quality'
            },
            testCoverage: {
              file: 'src/main.ts',
              hasTests: true,
              testFiles: ['src/main.test.ts'],
              untestedPaths: [],
              coverageEstimate: 90,
              summary: 'Well tested'
            },
            refactorings: {
              file: 'src/main.ts',
              suggestions: [],
              summary: 'No refactorings needed'
            }
          }
        ],
        summary: {
          totalFiles: 1,
          overallScore: 85,
          criticalIssues: 0,
          highPriorityTests: 0,
          refactoringOpportunities: 0
        },
        recommendations: [
          {
            priority: 'low' as const,
            category: 'documentation',
            description: 'Add JSDoc comments',
            files: ['src/main.ts']
          }
        ],
        metadata: {
          analyzedAt: new Date().toISOString(),
          duration: 5000,
          agentVersions: { orchestrator: '1.0.0' }
        }
      };

      const result = ReviewReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require all mandatory fields', () => {
      const invalidData = {
        pullRequest: {
          owner: 'octocat',
          repo: 'Hello-World'
          // missing number
        }
      };

      const result = ReviewReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Score boundaries', () => {
    it('should accept score 0-100', () => {
      const validLow = {
        file: 'test.ts',
        issues: [],
        overallScore: 0,
        summary: 'Zero score'
      };

      const validHigh = {
        file: 'test.ts',
        issues: [],
        overallScore: 100,
        summary: 'Perfect score'
      };

      expect(CodeQualityResultSchema.safeParse(validLow).success).toBe(true);
      expect(CodeQualityResultSchema.safeParse(validHigh).success).toBe(true);
    });

    it('should reject score outside 0-100', () => {
      const invalid = {
        file: 'test.ts',
        issues: [],
        overallScore: 150,
        summary: 'Invalid score'
      };

      expect(CodeQualityResultSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
