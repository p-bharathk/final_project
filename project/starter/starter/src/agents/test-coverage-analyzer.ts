/**
 * Test Coverage Analyzer Agent
 * Evaluates test completeness and identifies gaps in test coverage
 */
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/index.js';

export const testCoverageAnalyzer = {
  name: 'test-coverage-analyzer',
  description:
    'Specialized agent that evaluates test coverage and identifies untested code paths. Compares implementation files with corresponding test files, identifies missing test cases, and suggests specific test scenarios with meaningful assertions. Estimates coverage percentage and prioritizes critical untested functionality.',
  model: 'inherit' as const,
  tools: ['computer_use', 'bash', 'Skill'],
  prompt: TEST_COVERAGE_ANALYZER_PROMPT
} as const;
