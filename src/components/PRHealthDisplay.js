import { Box, Text } from 'ink';
import React from 'react';
import PRItem from './PRItem.js';

// Group PRs by repository within a feature
const groupPRsByRepo = (prs) => {
    const grouped = {};
    prs.forEach(pr => {
        const repo = pr.url.split('/')[4];
        if (!grouped[repo]) {
            grouped[repo] = [];
        }
        grouped[repo].push(pr);
    });
    return grouped;
};

// Pad string to fixed width
const padToWidth = (str, width) => {
    if (str.length >= width) {
        return str.slice(0, width);
    }
    return str.padEnd(width, ' ');
};

const REPO_COLUMN_WIDTH = 25;

const PRHealthDisplay = ({ results }) => {
    return (
        <Box flexDirection="column" padding={1}>
            {Object.entries(results).map(([feature, prs]) => (
                <Box key={feature} flexDirection="column" marginBottom={1}>
                    <Text bold color="blue">{feature}</Text>
                    {Object.entries(groupPRsByRepo(prs)).map(([repo, repoPRs]) => (
                        <Box key={repo} flexDirection="column">
                            <Box marginLeft={2}>
                                <Text color="gray">{padToWidth(repo, REPO_COLUMN_WIDTH)}</Text>
                                <Box flexDirection="column">
                                    {repoPRs.map((pr, index) => (
                                        <PRItem
                                            key={`${pr.url}-${index}`}
                                            pr={pr}
                                            isFirstInRepo={index === 0}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            ))}
        </Box>
    );
};

export default PRHealthDisplay; 