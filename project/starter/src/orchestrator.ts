import { query, type AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReport, ReviewReportSchema } from './types/report-types.js';
import { logger } from './utils/logger.js';
import { mcpServersConfig } from './config/mcp.config.js';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents/index.js';
import { ORCHESTRATOR_PROMPT } from './prompts/index.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
  private model: string;

  constructor(options: OrchestratorOptions = {}) {
    this.model = process.env.ANTHROPIC_MODEL || '';
    if (!this.model) {
      throw new Error('ANTHROPIC_MODEL environment variable is required');
    }
  }

  /**
   * Review a pull request using parallel subagent analysis
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Complete review report
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();
    logger.info(`Starting code review for ${owner}/${repo}#${prNumber}`);

    try {
      // Build the user message with PR details
      const userMessage = `Analyze the following GitHub pull request and provide a comprehensive code review:
- Owner: ${owner}
- Repository: ${repo}
- PR Number: ${prNumber}

Please fetch the PR data, invoke all three subagents for analysis (code-quality-analyzer, test-coverage-analyzer, refactoring-suggester), and aggregate their findings into a complete ReviewReport.`;

      // Execute the orchestrator query with subagents
      logger.info('Invoking orchestrator with subagents...');
      let finalResult: ReviewReport | null = null;
      let combinedText = '';

      // Combine system prompt with user message
      const fullPrompt = `${ORCHESTRATOR_PROMPT}\n\n${userMessage}`;

      // Iterate through the async generator returned by query
      let lastAssistantMessage = '';
      let messageCount = 0;

      for await (const event of query({
        prompt: fullPrompt,
        options: {
          model: this.model,
          mcpServers: mcpServersConfig,
          agents: {
            codeQualityAnalyzer: codeQualityAnalyzer as unknown as AgentDefinition,
            testCoverageAnalyzer: testCoverageAnalyzer as unknown as AgentDefinition,
            refactoringSuggester: refactoringSuggester as unknown as AgentDefinition
          },
          allowedTools: ['Task', 'mcp__github', 'mcp__eslint']
        }
      })) {
        const eventType = (event as any).type;
        messageCount++;

        // Collect text from all event types
        const eventObj = event as any;

        // Extract text from the message property (agent SDK format)
        if (eventObj.message && typeof eventObj.message === 'string' && eventObj.message.trim()) {
          combinedText += eventObj.message;
          if (eventType === 'assistant') {
            lastAssistantMessage = eventObj.message;
          }
        }

        // Extract from result property (final result object)
        if (eventType === 'result' && eventObj.result) {
          if (typeof eventObj.result === 'string' && eventObj.result.trim()) {
            combinedText += eventObj.result;
            lastAssistantMessage = eventObj.result;
          } else if (typeof eventObj.result === 'object') {
            // If result is an object, try to stringify it
            const resultStr = JSON.stringify(eventObj.result);
            if (resultStr && resultStr.trim() !== '{}') {
              combinedText += resultStr;
              lastAssistantMessage = resultStr;
            }
          }
        }
      }

      logger.info(`Processed ${messageCount} events, collected ${combinedText.length} characters`);
      if (lastAssistantMessage.length > 0) {
        logger.debug(`Last assistant message preview: ${lastAssistantMessage.substring(0, 200)}...`);
      }

      // Parse the combined text to extract JSON report
      // Look for JSON block in the response
      let jsonMatch = combinedText.match(/\{[\s\S]*\}/);

      // If no JSON found in combined text, try the last assistant message
      if (!jsonMatch && lastAssistantMessage) {
        logger.debug('Trying to parse JSON from last assistant message...');
        jsonMatch = lastAssistantMessage.match(/\{[\s\S]*\}/);
      }

      if (jsonMatch) {
        try {
          finalResult = JSON.parse(jsonMatch[0]);
          logger.info('Successfully parsed JSON report from orchestrator response');
        } catch (e) {
          logger.warn('Failed to parse JSON from response:', e);
          logger.debug(`Response text: ${combinedText.substring(0, 500)}...`);
        }
      } else {
        logger.warn('No JSON found in orchestrator response');
        logger.debug(`Combined response text: ${combinedText.substring(0, 500)}...`);
        if (lastAssistantMessage) {
          logger.debug(`Last message: ${lastAssistantMessage.substring(0, 500)}...`);
        }
      }

      if (!finalResult) {
        throw new Error('Orchestrator failed to return structured output');
      }

      // Try strict validation first
      const validatedResult = ReviewReportSchema.safeParse(finalResult);
      if (validatedResult.success) {
        // Validation passed, use validated data
        const duration = (Date.now() - startTime) / 1000;
        logger.info(
          `Code review completed in ${duration.toFixed(2)}s for ${owner}/${repo}#${prNumber}`
        );
        return validatedResult.data;
      } else {
        // If strict validation fails but we have a report with core fields, use it
        if (finalResult && finalResult.pullRequest && finalResult.pullRequest.owner) {
          logger.warn('Schema validation found issues but accepting partial real agent data');
          const duration = (Date.now() - startTime) / 1000;
          logger.info(
            `Code review completed (partial) in ${duration.toFixed(2)}s for ${owner}/${repo}#${prNumber}`
          );
          // Use the incomplete but real data from agents
          return finalResult as any as ReviewReport;
        } else {
          logger.error('Schema validation failed:', validatedResult.error);
          throw new Error(
            `Invalid report structure: ${validatedResult.error.message}`
          );
        }
      }
    } catch (error) {
      logger.error('Orchestrator error:', error);
      throw error;
    }
  }
}
