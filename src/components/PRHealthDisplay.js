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

// Build PR hierarchy tree
const buildPRTree = (prs) => {
    const prMap = new Map(prs.map(pr => [pr.url, { ...pr, children: [] }]));
    const roots = [];

    // Create a map of head refs to PRs for quick lookup
    const headRefToPR = new Map();
    prMap.forEach((pr) => {
        if (pr.head && pr.head.ref) {
            headRefToPR.set(pr.head.ref, pr);
        }
    });

    // Find parent-child relationships
    prMap.forEach(pr => {
        if (pr.base && pr.base.ref) {
            const parentPR = headRefToPR.get(pr.base.ref);
            if (parentPR) {
                parentPR.children.push(pr);
            } else {
                roots.push(pr);
            }
        } else {
            roots.push(pr);
        }
    });

    return roots;
};

// Render PR tree recursively
const renderPRTree = (pr, level = 0) => {
    return (
        <Box key={pr.url} flexDirection="column">
            <PRItem pr={pr} level={level} />
            {pr.children.map(child => renderPRTree(child, level + 1))}
        </Box>
    );
};

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
                                    {buildPRTree(repoPRs).map(pr => renderPRTree(pr))}
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