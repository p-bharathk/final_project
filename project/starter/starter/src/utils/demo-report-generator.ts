import { ReviewReport } from '../types/report-types.js';

/**
 * Generate a demo/sample ReviewReport that matches the schema
 * Useful for testing report generation without running full analysis
 */
export function generateDemoReport(
  owner: string,
  repo: string,
  prNumber: number
): ReviewReport {
  const now = new Date();

  return {
    pullRequest: {
      owner,
      repo,
      number: prNumber
    },
    fileReviews: [
      {
        file: 'src/components/TodoItem.tsx',
        codeQuality: {
          file: 'src/components/TodoItem.tsx',
          issues: [
            {
              line: 42,
              severity: 'high',
              category: 'performance',
              description:
                'Potential performance issue: re-creating object on every render',
              suggestion:
                'Memoize the object using useMemo or move outside component'
            },
            {
              line: 65,
              severity: 'medium',
              category: 'maintainability',
              description:
                'Function is too long and handles multiple responsibilities',
              suggestion:
                'Extract event handlers into separate functions or custom hook'
            },
            {
              line: 15,
              severity: 'info',
              category: 'style',
              description: 'Missing PropTypes or TypeScript interface documentation',
              suggestion: 'Add JSDoc comments for props'
            }
          ],
          overallScore: 72,
          summary: 'Component has good structure but needs performance optimization'
        },
        testCoverage: {
          file: 'src/components/TodoItem.tsx',
          hasTests: true,
          testFiles: ['src/components/__tests__/TodoItem.test.tsx'],
          untestedPaths: [
            {
              type: 'function',
              location: 'handleDelete handler at line 48',
              priority: 'high',
              reasoning:
                'Critical user action - deletion must be tested thoroughly',
              suggestedTest:
                'test("should call onDelete with correct ID when delete button clicked", () => { ... })'
            },
            {
              type: 'branch',
              location: 'completed state check at line 25',
              priority: 'medium',
              reasoning: 'Visual state changes depend on this condition',
              suggestedTest:
                'test("should show strikethrough when todo is completed", () => { ... })'
            }
          ],
          coverageEstimate: 68,
          summary:
            'Basic tests exist but missing edge cases and user interaction coverage'
        },
        refactorings: {
          file: 'src/components/TodoItem.tsx',
          suggestions: [
            {
              type: 'extract-function',
              location: 'handleClick and event handlers at lines 48-62',
              impact: 'high',
              description:
                'Extract event handlers into a custom hook for better reusability',
              before:
                'const TodoItem = ({ todo, onDelete }) => {\n  const handleClick = () => { ... }\n  const handleDelete = () => { ... }\n  return <div>...</div>\n}',
              after:
                'const useTodoHandlers = (todo) => ({ handleClick: ..., handleDelete: ... })\nconst TodoItem = ({ todo, onDelete }) => {\n  const { handleClick, handleDelete } = useTodoHandlers(todo)\n  return <div>...</div>\n}',
              benefits:
                'Improves code reusability and makes testing easier - handlers can be tested separately'
            },
            {
              type: 'modernize',
              location: 'className string concatenation at line 20',
              impact: 'low',
              description: 'Use modern template literals or CSS-in-JS instead of string concatenation',
              before: "const className = 'todo-item ' + (todo.completed ? 'completed' : '')",
              after: "const className = `todo-item ${todo.completed ? 'completed' : ''}`",
              benefits: 'Improved readability and easier to maintain complex class names'
            }
          ],
          summary: 'Several opportunities to improve code structure and maintainability'
        }
      },
      {
        file: 'src/services/todoApi.ts',
        codeQuality: {
          file: 'src/services/todoApi.ts',
          issues: [
            {
              line: 12,
              severity: 'high',
              category: 'security',
              description:
                'API endpoint is hardcoded - could expose sensitive URLs',
              suggestion:
                'Move to environment variables using process.env.REACT_APP_API_URL'
            },
            {
              line: 35,
              severity: 'high',
              category: 'best-practice',
              description: 'Missing error handling for network requests',
              suggestion: 'Add try-catch or .catch() handler for fetch promises'
            }
          ],
          overallScore: 65,
          summary:
            'Security concerns with hardcoded URLs and insufficient error handling'
        },
        testCoverage: {
          file: 'src/services/todoApi.ts',
          hasTests: false,
          testFiles: [],
          untestedPaths: [
            {
              type: 'function',
              location: 'fetchTodos at line 8',
              priority: 'critical',
              reasoning:
                'All API calls are untested - critical for functionality',
              suggestedTest:
                'test("fetchTodos should call API and return parsed data", async () => { ... mock fetch ... })'
            },
            {
              type: 'function',
              location: 'createTodo at line 15',
              priority: 'critical',
              reasoning: 'User data modification - must test validation',
              suggestedTest:
                'test("createTodo should POST with correct data", async () => { ... })'
            },
            {
              type: 'branch',
              location: 'error handling at line 38-42',
              priority: 'high',
              reasoning: 'Error paths are never validated',
              suggestedTest:
                'test("fetchTodos should handle network errors gracefully", async () => { ... })'
            }
          ],
          coverageEstimate: 0,
          summary: 'No test coverage - entire service layer needs tests'
        },
        refactorings: {
          file: 'src/services/todoApi.ts',
          suggestions: [
            {
              type: 'extract-function',
              location: 'fetchWithErrorHandling at lines 28-45',
              impact: 'high',
              description:
                'Extract common fetch+error handling pattern into utility',
              before:
                'export const updateTodo = async (id, data) => {\n  try {\n    const response = await fetch(...)\n    if (!response.ok) throw new Error(...)\n    return response.json()\n  } catch (e) { ... }\n}',
              after:
                'const withErrorHandling = async (promise) => { try { ... } catch { ... } }\nexport const updateTodo = (id, data) => withErrorHandling(fetch(...))',
              benefits:
                'Reduces code duplication and makes error handling consistent across all API calls'
            }
          ],
          summary: 'Opportunity to reduce boilerplate with utility functions'
        }
      }
    ],
    summary: {
      totalFiles: 2,
      overallScore: 68,
      criticalIssues: 2,
      highPriorityTests: 4,
      refactoringOpportunities: 3
    },
    recommendations: [
      {
        priority: 'critical',
        category: 'security',
        description:
          'Remove hardcoded API URLs and use environment variables for sensitive configuration',
        files: ['src/services/todoApi.ts']
      },
      {
        priority: 'high',
        category: 'testing',
        description:
          'Add comprehensive tests for API service layer - currently 0% coverage',
        files: ['src/services/todoApi.ts']
      },
      {
        priority: 'high',
        category: 'testing',
        description:
          'Complete user interaction testing for TodoItem component (delete, complete, edit)',
        files: ['src/components/TodoItem.tsx']
      },
      {
        priority: 'medium',
        category: 'refactoring',
        description:
          'Extract event handlers into custom hook to improve reusability and testability',
        files: ['src/components/TodoItem.tsx']
      },
      {
        priority: 'medium',
        category: 'performance',
        description:
          'Add React.memo() to TodoItem component to prevent unnecessary re-renders',
        files: ['src/components/TodoItem.tsx']
      }
    ],
    metadata: {
      analyzedAt: now.toISOString(),
      duration: 5423,
      agentVersions: {
        orchestrator: '1.0.0',
        'code-quality-analyzer': '1.0.0',
        'test-coverage-analyzer': '1.0.0',
        'refactoring-suggester': '1.0.0'
      }
    }
  };
}
