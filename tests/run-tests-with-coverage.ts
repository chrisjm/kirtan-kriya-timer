/**
 * Script to run tests with coverage reporting
 *
 * This script runs the Playwright tests and generates a coverage report.
 * Usage: npm run test:coverage
 */

import { exec } from 'child_process';
import { processCoverageReport } from './coverage-helper';
import path from 'path';

const COVERAGE_DIR = path.join(__dirname, '../coverage');
const JSON_REPORT_PATH = path.join(COVERAGE_DIR, 'coverage-report.json');
const MARKDOWN_REPORT_PATH = path.join(COVERAGE_DIR, 'coverage-report.md');

/**
 * Run the Playwright tests with coverage enabled
 */
const runTests = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		console.log('Running Playwright tests with coverage...');

		// Run the tests with coverage enabled
		const command = 'npx playwright test --reporter=json';

		exec(command, (error, _stdout, stderr) => {
			if (error) {
				console.error(`Error running tests: ${error.message}`);
				console.error(stderr);
				reject(error);
				return;
			}

			console.log('Tests completed successfully.');
			resolve();
		});
	});
};

/**
 * Main function to run tests and generate coverage report
 */
const main = async (): Promise<void> => {
	try {
		// Run the tests
		await runTests();

		// Process the coverage report
		console.log('Generating coverage report...');
		processCoverageReport(JSON_REPORT_PATH, MARKDOWN_REPORT_PATH);

		console.log('Done!');
	} catch (error) {
		console.error('Failed to run tests or generate coverage report:', error);
		process.exit(1);
	}
};

// Run the main function
main();
