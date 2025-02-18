#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import { PRHealthController } from './controllers/pr-health.controller.js';

const program = new Command();

program
    .name('pr-tracker')
    .description('GitHub PR Management Tool')
    .version('1.0.0');

program
    .command('check-health')
    .description('Check the health status of PRs')
    .option('-f, --file <path>', 'Path to JSON file containing PR lists', 'status.json')
    .action(async (options) => {
        try {
            const fileContent = await fs.readFile(options.file, 'utf8');
            const prLists = JSON.parse(fileContent);

            const controller = new PRHealthController();
            const results = await controller.checkHealth(prLists);

            console.log('\nPR Health Check Results:');
            for (const [feature, prs] of Object.entries(results)) {
                console.log(`\n${feature}:`);
                prs.forEach(pr => {
                    console.log(`\n  ${pr.url}`);
                    console.log(`  Title: ${pr.title || 'N/A'}`);
                    console.log(`  Status: ${pr.status}`);
                    if (pr.issues.length > 0) {
                        console.log('  Issues:');
                        pr.issues.forEach(issue => console.log(`    - ${issue}`));
                    }
                });
            }
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });

program.parse(); 