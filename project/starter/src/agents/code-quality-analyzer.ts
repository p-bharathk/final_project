/**
 * Code Quality Analyzer Agent
 * Analyzes code for security vulnerabilities, performance issues, and best practices
 */
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/index.js';

export const codeQualityAnalyzer = {
  name: 'code-quality-analyzer',
  description:
    'Specialized agent that analyzes pull request code for security vulnerabilities, performance issues, and adherence to best practices. Looks for potential bugs, security flaws, performance bottlenecks, and maintainability concerns. Leverages security analysis and JavaScript best practices skills.',
  model: 'inherit' as const,
  tools: ['computer_use', 'bash', 'Skill'],
  prompt: CODE_QUALITY_ANALYZER_PROMPT
} as const;
