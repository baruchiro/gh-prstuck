import { Box, Text } from 'ink';
import React from 'react';
import PRItem from './PRItem.js';

// Group PRs by repository within a feature
const groupPRsByRepo = (prUrls, prsData) => {
    if (!Array.isArray(prUrls)) {
        console.error('groupPRsByRepo received invalid prUrls:', prUrls);
        return {};
    }

    const grouped = {};
    prUrls.forEach(url => {
        try {
            const pr = prsData[url];
            if (!pr) {
                return;
            }
            const repo = url.split('/')[4];
            if (!grouped[repo]) {
                grouped[repo] = [];
            }
            grouped[repo].push(pr);
        } catch (error) {
            console.error('Error processing PR in groupPRsByRepo:', { url, error: error.message });
        }
    });
    return grouped;
};

// Pad string to fixed width
const padToWidth = (str, width) => {
    if (typeof str !== 'string') {
        console.error('padToWidth received non-string value:', str);
        return ' '.repeat(width);
    }
    if (str.length >= width) {
        return str.slice(0, width);
    }
    return str.padEnd(width, ' ');
};

const REPO_COLUMN_WIDTH = 25;

// Build PR hierarchy tree
const buildPRTree = (prs) => {
    if (!Array.isArray(prs)) {
        console.error('buildPRTree received invalid prs:', prs);
        return [];
    }

    try {
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
    } catch (error) {
        console.error('Error building PR tree:', error.message);
        return [];
    }
};

// Render PR tree recursively
const renderPRTree = (pr, level = 0) => {
    if (!pr || !pr.url) {
        console.error('Invalid PR object in renderPRTree:', pr);
        return null;
    }

    return (
        <Box key={pr.url} flexDirection="column">
            <PRItem pr={pr} level={level} />
            {pr.children?.map?.(child => renderPRTree(child, level + 1))}
        </Box>
    );
};

// Render a feature's content
const renderFeatureContent = (featureName, feature, features, prsData, level = 0) => {
    if (!feature || !Array.isArray(feature.prs)) {
        console.error('Invalid feature data:', { featureName, feature });
        return (
            <Box flexDirection="column" marginBottom={1}>
                <Text bold color="red">{featureName} (Invalid data)</Text>
            </Box>
        );
    }

    const groupedPRs = groupPRsByRepo(feature.prs, prsData);
    const indent = level * 2;

    return (
        <Box flexDirection="column" marginBottom={1}>
            <Text bold color="blue">{featureName}</Text>
            {Object.entries(groupedPRs).map(([repo, repoPRs]) => (
                <Box key={repo} flexDirection="column">
                    <Box marginLeft={2 + indent}>
                        <Text color="gray">{padToWidth(repo, REPO_COLUMN_WIDTH)}</Text>
                        <Box flexDirection="column">
                            {buildPRTree(repoPRs).map(pr => renderPRTree(pr))}
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

// Find features that depend on the given feature
const findDependentFeatures = (targetFeature, features) => {
    return Object.entries(features)
        .filter(([name, feature]) => feature.dependencies?.includes(targetFeature))
        .map(([name]) => name);
};

const PRHealthDisplay = ({ results }) => {
    if (!results) {
        console.error('PRHealthDisplay received null/undefined results');
        return <Text color="red">Error: No results data provided</Text>;
    }

    const features = results.Features || {};
    const prsData = results.prs || {};

    if (Object.keys(features).length === 0) {
        console.error('No features found in results');
        return <Text color="yellow">No features found in the data</Text>;
    }

    // Find root features (those with no dependencies)
    const rootFeatures = Object.entries(features)
        .filter(([_, feature]) => !feature.dependencies?.length)
        .map(([name]) => name);

    // Track rendered features to avoid duplicates
    const renderedFeatures = new Set();

    const renderFeatureTree = (featureName, level = 0) => {
        if (renderedFeatures.has(featureName)) {
            return null;
        }

        renderedFeatures.add(featureName);
        const feature = features[featureName];
        const dependentFeatures = findDependentFeatures(featureName, features);

        return (
            <Box key={featureName} flexDirection="column" marginLeft={level * 2}>
                {renderFeatureContent(featureName, feature, features, prsData, level)}
                {dependentFeatures.map(depFeature => (
                    <Box key={depFeature} flexDirection="column" marginLeft={2}>
                        <Text color="gray">↓ Required by:</Text>
                        {renderFeatureTree(depFeature, level + 1)}
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Box flexDirection="column" padding={1}>
            {rootFeatures.map(featureName => renderFeatureTree(featureName))}
            {/* Render any features that weren't part of the dependency tree */}
            {Object.keys(features)
                .filter(name => !renderedFeatures.has(name))
                .map(featureName => renderFeatureTree(featureName))}
        </Box>
    );
};

export default PRHealthDisplay; 