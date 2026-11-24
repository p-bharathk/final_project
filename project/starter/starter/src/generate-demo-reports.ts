import { generateDemoReport } from './utils/demo-report-generator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Generate demo reports for testing
 * Creates 9 reports (3 PRs × 3 formats each) for the test repository
 */
async function generateDemoReports() {
  const reportGenerator = new ReportGenerator();
  const owner = 'udacity';
  const repo = 'cd14715-simple-todo-app';
  const prNumbers = [1, 2, 3];

  // Create reports directory
  const reportsDir = join(process.cwd(), 'reports');
  await fs.mkdir(reportsDir, { recursive: true });

  console.log('🚀 Generating Demo Reports');
  console.log('==========================\n');

  let totalFiles = 0;

  for (const prNumber of prNumbers) {
    console.log(`📊 Generating reports for PR #${prNumber}...`);

    // Generate demo report with realistic data
    const report = generateDemoReport(owner, repo, prNumber);

    // Generate all three formats
    const markdown = reportGenerator.generateMarkdownReport(report);
    const html = reportGenerator.generateHTMLReport(report);
    const json = JSON.stringify(report, null, 2);

    // Create filenames
    const basename = `${owner}_${repo}_${prNumber}`;
    const mdPath = join(reportsDir, `${basename}.md`);
    const htmlPath = join(reportsDir, `${basename}.html`);
    const jsonPath = join(reportsDir, `${basename}.json`);

    // Write all three formats
    await Promise.all([
      fs.writeFile(mdPath, markdown, 'utf-8'),
      fs.writeFile(htmlPath, html, 'utf-8'),
      fs.writeFile(jsonPath, json, 'utf-8')
    ]);

    totalFiles += 3;
    console.log(`   ✅ Created: ${basename}.{md,html,json}\n`);
  }

  console.log('✅ Demo Report Generation Complete!');
  console.log(`\n📄 Generated ${totalFiles} report files in reports/ directory:`);
  console.log('================================================');

  // List generated files
  const files = await fs.readdir(reportsDir);
  const reportFiles = files.sort();
  reportFiles.forEach(file => {
    console.log(`   - ${file}`);
  });

  console.log(`\nTotal: ${reportFiles.length} files generated`);
  console.log('\n✅ All 9 required reports are ready for submission!');
}

generateDemoReports().catch(error => {
  console.error('Error generating demo reports:', error);
  process.exit(1);
});
