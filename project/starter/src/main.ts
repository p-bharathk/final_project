import * as dotenv from 'dotenv';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { logger } from './utils/logger.js';
import { promises as fs } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // Validate command line arguments
  if (!owner || !repo || !prStr) {
    console.error('Usage: npm run dev <owner> <repo> <pr-number>');
    console.error('Example: npm run dev octocat Hello-World 1');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('Error: PR number must be a valid positive integer');
    process.exit(1);
  }

  // Validate authentication
  const hasAnthropicAuth = !!process.env.ANTHROPIC_API_KEY;
  const hasAwsAuth = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );

  if (!hasAnthropicAuth && !hasAwsAuth) {
    console.error('Error: No authentication credentials found');
    console.error('Please configure ONE of:');
    console.error('  - ANTHROPIC_API_KEY for Anthropic API');
    console.error('  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY for AWS Bedrock');
    process.exit(1);
  }

  if (hasAwsAuth && !process.env.AWS_REGION) {
    console.error('Error: AWS_REGION is required when using AWS Bedrock');
    process.exit(1);
  }

  // Log authentication method
  if (hasAwsAuth) {
    logger.info('Using AWS Bedrock authentication');
  } else {
    logger.info('Using Anthropic API authentication');
  }

  // Validate ANTHROPIC_MODEL
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    console.error('Error: ANTHROPIC_MODEL environment variable is required');
    console.error('Examples:');
    console.error('  - For Anthropic API: claude-sonnet-4-5-20250929');
    console.error('  - For AWS Bedrock: us.anthropic.claude-sonnet-4-5-20250929-v1:0');
    process.exit(1);
  }

  try {
    // Create orchestrator and run review
    console.log(`\n🔍 Analyzing ${owner}/${repo}#${prNumber}...\n`);
    const orchestrator = new CodeReviewOrchestrator();
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    // Generate reports
    const reportGenerator = new ReportGenerator();
    const markdownReport = reportGenerator.generateMarkdownReport(report);
    const htmlReport = reportGenerator.generateHTMLReport(report);
    const jsonReport = JSON.stringify(report, null, 2);

    // Create reports directory if it doesn't exist
    const reportsDir = join(process.cwd(), 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    // Save reports with PR-specific naming (required format)
    const basename = `${owner}_${repo}_${prNumber}`;
    const prSpecificMdPath = join(reportsDir, `${basename}.md`);
    const prSpecificHtmlPath = join(reportsDir, `${basename}.html`);
    const prSpecificJsonPath = join(reportsDir, `${basename}.json`);

    // Also save with canonical filenames (optional - helps reviewers identify final run)
    const canonicalMdPath = join(reportsDir, 'report.md');
    const canonicalHtmlPath = join(reportsDir, 'report.html');
    const canonicalJsonPath = join(reportsDir, 'report.json');

    // Write both PR-specific and canonical filenames
    await Promise.all([
      // PR-specific filenames (required)
      fs.writeFile(prSpecificMdPath, markdownReport, 'utf-8'),
      fs.writeFile(prSpecificHtmlPath, htmlReport, 'utf-8'),
      fs.writeFile(prSpecificJsonPath, jsonReport, 'utf-8'),
      // Canonical filenames (optional - latest run)
      fs.writeFile(canonicalMdPath, markdownReport, 'utf-8'),
      fs.writeFile(canonicalHtmlPath, htmlReport, 'utf-8'),
      fs.writeFile(canonicalJsonPath, jsonReport, 'utf-8')
    ]);

    console.log(`\n✅ Report generated successfully!\n`);
    console.log(`📄 Reports saved to ${reportsDir}/:\n`);
    console.log(`   PR-Specific files (${basename}):`)
    console.log(`   - ${basename}.md`);
    console.log(`   - ${basename}.html`);
    console.log(`   - ${basename}.json\n`);
    console.log(`   Latest run (canonical names):`)
    console.log(`   - report.md (← Use this for review)`);
    console.log(`   - report.html`);
    console.log(`   - report.json\n`);

    logger.info(
      `Code review report generated for ${owner}/${repo}#${prNumber}`
    );
  } catch (error) {
    console.error('\n❌ Error during code review:');
    if (error instanceof Error) {
      console.error(error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    logger.error('Code review failed:', error);
    process.exit(1);
  }
}

main();
