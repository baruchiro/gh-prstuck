#!/usr/bin/env node

import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { render } from 'ink';
import App from './components/App.js';
import FeatureManager from './components/FeatureManager.js';
import PRSelector from './components/PRSelector.js';

const program = new Command();

program
    .name('gh-prstuck')
    .description('Get unstuck and stack smarter with your PRs')
    .version('1.0.0');

program
    .command('stuck')
    .description('Find out what\'s keeping your PRs stuck')
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

program
    .command('list')
    .description('List your PRs and organize them into features')
    .option('-f, --file <path>', 'Path to JSON file to save PR lists', 'status.json')
    .action(async (options) => {
        try {
            // Try to read existing features from status file
            let existingFeatures = {};
            try {
                const fileContent = await readFile(options.file, 'utf8');
                existingFeatures = JSON.parse(fileContent);
            } catch (error) {
                // File doesn't exist or is invalid, start with empty features
            }

            // Render the PR selector UI
            const { waitUntilExit } = render(<PRSelector
                existingFeatures={existingFeatures}
                onSave={async (features) => {
                    await writeFile(options.file, JSON.stringify(features, null, 4));
                    process.exit(0);
                }}
            />);

            await waitUntilExit();
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('features')
    .description('Manage feature hierarchies and dependencies')
    .option('-f, --file <path>', 'Path to JSON file containing PR lists', 'status.json')
    .action(async (options) => {
        try {
            // Try to read existing features from status file
            let existingFeatures = {};
            try {
                const fileContent = await readFile(options.file, 'utf8');
                existingFeatures = JSON.parse(fileContent);
            } catch (error) {
                // File doesn't exist or is invalid, start with empty features
                existingFeatures = { Features: {} };
            }

            // Render the feature manager UI
            const { waitUntilExit } = render(<FeatureManager
                existingFeatures={existingFeatures}
                onSave={async (features) => {
                    await writeFile(options.file, JSON.stringify(features, null, 4));
                    process.exit(0);
                }}
            />);

            await waitUntilExit();
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    });

program.parse(); 