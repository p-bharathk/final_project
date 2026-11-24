/**
 * Refactoring Suggester Agent
 * Identifies opportunities to improve code structure and modernize patterns
 */
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/index.js';

export const refactoringSuggester = {
  name: 'refactoring-suggester',
  description:
    'Specialized agent that identifies refactoring opportunities and architectural improvements. Looks for code that could benefit from design pattern improvements, extract method/class candidates, dead code elimination, and modernization of language features. Suggests specific before/after code examples with clear benefits.',
  model: 'inherit' as const,
  tools: ['computer_use', 'bash', 'Skill'],
  prompt: REFACTORING_SUGGESTER_PROMPT
} as const;
