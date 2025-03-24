/**
 * Coverage Helper for Kirtan Kriya Timer Tests
 * 
 * This file helps track and report test coverage for the application.
 * It's used in conjunction with Playwright's coverage reporting.
 */

import fs from 'fs';
import path from 'path';

/**
 * Interface for coverage report data
 */
interface CoverageReport {
  timestamp: string;
  summary: {
    lines: {
      total: number;
      covered: number;
      percentage: number;
    };
    statements: {
      total: number;
      covered: number;
      percentage: number;
    };
    functions: {
      total: number;
      covered: number;
      percentage: number;
    };
    branches: {
      total: number;
      covered: number;
      percentage: number;
    };
  };
  files: Array<{
    path: string;
    lines: {
      total: number;
      covered: number;
      percentage: number;
    };
    functions: {
      total: number;
      covered: number;
      percentage: number;
    };
    statements: {
      total: number;
      covered: number;
      percentage: number;
    };
    branches: {
      total: number;
      covered: number;
      percentage: number;
    };
  }>;
}

/**
 * Saves the coverage report to a JSON file
 */
export const saveCoverageReport = (report: CoverageReport, outputPath: string): void => {
  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write report to file
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`Coverage report saved to ${outputPath}`);
  } catch (error) {
    console.error('Failed to save coverage report:', error);
  }
};

/**
 * Generates a markdown report from the coverage data
 */
export const generateMarkdownReport = (report: CoverageReport): string => {
  const timestamp = new Date(report.timestamp).toLocaleString();
  
  let markdown = `# Kirtan Kriya Timer - Test Coverage Report\n\n`;
  markdown += `Generated: ${timestamp}\n\n`;
  
  // Summary table
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Total | Covered | Coverage |\n`;
  markdown += `| ------ | ----- | ------- | -------- |\n`;
  markdown += `| Lines | ${report.summary.lines.total} | ${report.summary.lines.covered} | ${report.summary.lines.percentage.toFixed(2)}% |\n`;
  markdown += `| Statements | ${report.summary.statements.total} | ${report.summary.statements.covered} | ${report.summary.statements.percentage.toFixed(2)}% |\n`;
  markdown += `| Functions | ${report.summary.functions.total} | ${report.summary.functions.covered} | ${report.summary.functions.percentage.toFixed(2)}% |\n`;
  markdown += `| Branches | ${report.summary.branches.total} | ${report.summary.branches.covered} | ${report.summary.branches.percentage.toFixed(2)}% |\n\n`;
  
  // Files table
  markdown += `## Files\n\n`;
  markdown += `| File | Lines | Statements | Functions | Branches |\n`;
  markdown += `| ---- | ----- | ---------- | --------- | -------- |\n`;
  
  // Sort files by coverage percentage (ascending)
  const sortedFiles = [...report.files].sort((a, b) => 
    a.lines.percentage - b.lines.percentage
  );
  
  for (const file of sortedFiles) {
    const relativePath = file.path.replace(/^.*\/src\//, 'src/');
    markdown += `| ${relativePath} | ${file.lines.percentage.toFixed(2)}% | ${file.statements.percentage.toFixed(2)}% | ${file.functions.percentage.toFixed(2)}% | ${file.branches.percentage.toFixed(2)}% |\n`;
  }
  
  // Uncovered sections
  markdown += `\n## Areas Needing More Coverage\n\n`;
  
  const lowCoverageFiles = sortedFiles.filter(file => file.lines.percentage < 80);
  
  if (lowCoverageFiles.length === 0) {
    markdown += `All files have good coverage (>= 80%).\n`;
  } else {
    markdown += `The following files have less than 80% line coverage and may need additional tests:\n\n`;
    for (const file of lowCoverageFiles) {
      const relativePath = file.path.replace(/^.*\/src\//, 'src/');
      markdown += `- ${relativePath} (${file.lines.percentage.toFixed(2)}%)\n`;
    }
  }
  
  return markdown;
};

/**
 * Saves the markdown report to a file
 */
export const saveMarkdownReport = (markdown: string, outputPath: string): void => {
  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write markdown to file
    fs.writeFileSync(outputPath, markdown);
    console.log(`Markdown report saved to ${outputPath}`);
  } catch (error) {
    console.error('Failed to save markdown report:', error);
  }
};

/**
 * Process coverage report from JSON file and generate markdown
 */
export const processCoverageReport = (jsonPath: string, markdownPath: string): void => {
  try {
    if (!fs.existsSync(jsonPath)) {
      console.error(`Coverage report not found at ${jsonPath}`);
      return;
    }
    
    const reportJson = fs.readFileSync(jsonPath, 'utf8');
    const report = JSON.parse(reportJson) as CoverageReport;
    
    const markdown = generateMarkdownReport(report);
    saveMarkdownReport(markdown, markdownPath);
  } catch (error) {
    console.error('Failed to process coverage report:', error);
  }
};
