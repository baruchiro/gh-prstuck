#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { render } from 'ink';
import App from './components/App.js';

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
            const fileContent = await readFile(options.file, 'utf8');
            const prLists = JSON.parse(fileContent);

            // Render the Ink app
            render(<App prListsFile={prLists} />);
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });

program.parse(); 