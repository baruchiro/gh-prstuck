import { Box, Text, useInput, useStdout } from 'ink';
import React, { useEffect, useState } from 'react';
import { GitHubService } from '../services/github.service.js';
import { PRHealthService } from '../services/pr-health.service.js';

const padToWidth = (str, width) => {
    if (str.length >= width) {
        return str.slice(0, width);
    }
    return str.padEnd(width, ' ');
};

const Cleanup = ({ existingFeatures, onSave }) => {
    const { stdout } = useStdout();
    const visibleItems = stdout.rows - 5;
    const prHealthService = new PRHealthService();
    const githubService = new GitHubService();

    const [state, setState] = useState({
        loading: true,
        error: null,
        selectedPRs: new Set(),
        selectedFeatures: new Set(),
        selectedIndex: 0,
        scrollOffset: 0,
        prStatuses: new Map(),
        repoColumnWidth: 20,
        listType: 'prs', // 'prs' or 'features'
        currentUser: null
    });

    const loadPRStatuses = async () => {
        setState(s => ({ ...s, loading: true }));
        const statuses = new Map();

        try {
            const currentUser = await githubService.getCurrentUser();

            for (const feature of Object.values(existingFeatures.Features || {})) {
                if (!feature.prs) continue;
                for (const pr of feature.prs) {
                    if (!statuses.has(pr)) {
                        const status = await prHealthService.checkPRHealth(pr);
                        statuses.set(pr, status);
                    }
                }
            }

            // Calculate max repo width
            const maxRepoLength = Math.min(
                30,
                Math.max(10,
                    ...Array.from(statuses.values())
                        .map(pr => pr.url.split('/')[4]?.length || 0)
                )
            );

            setState(s => ({
                ...s,
                loading: false,
                prStatuses: statuses,
                repoColumnWidth: maxRepoLength + 2,
                currentUser
            }));
        } catch (error) {
            setState(s => ({
                ...s,
                loading: false,
                error: error.message
            }));
        }
    };

    useEffect(() => {
        loadPRStatuses();
    }, []);

    const getClosedPRs = () => {
        return Array.from(state.prStatuses.entries())
            .filter(([, status]) => status.state === 'closed' || status.merged)
            .map(([url, status]) => ({
                url,
                title: status.title,
                repository: url.split('/')[4],
                state: status.state,
                merged: status.merged
            }));
    };

    const getEmptyFeatures = () => {
        return Object.entries(existingFeatures.Features || {})
            .filter(([, feature]) => !feature.prs || feature.prs.length === 0)
            .map(([name]) => name);
    };

    const cleanup = () => {
        const updatedFeatures = {
            Features: {}
        };

        // Copy all features first
        for (const [name, feature] of Object.entries(existingFeatures.Features || {})) {
            if (!state.selectedFeatures.has(name)) {
                updatedFeatures.Features[name] = {
                    ...feature,
                    prs: feature.prs?.filter(pr => !state.selectedPRs.has(pr)) || []
                };
            }
        }

        onSave(updatedFeatures);
    };

    useInput((input, key) => {
        if (key.upArrow) {
            setState(s => ({
                ...s,
                selectedIndex: Math.max(0, s.selectedIndex - 1),
                scrollOffset: Math.max(
                    0,
                    Math.min(
                        s.scrollOffset,
                        s.selectedIndex - 1
                    )
                )
            }));
        } else if (key.downArrow) {
            const maxIndex = state.listType === 'prs' ? getClosedPRs().length - 1 : getEmptyFeatures().length - 1;
            setState(s => ({
                ...s,
                selectedIndex: Math.min(maxIndex, s.selectedIndex + 1),
                scrollOffset: Math.max(
                    0,
                    Math.min(
                        s.scrollOffset,
                        s.selectedIndex - visibleItems + 2
                    )
                )
            }));
        } else if (input === ' ') {
            if (state.listType === 'prs') {
                const pr = getClosedPRs()[state.selectedIndex];
                if (pr) {
                    setState(s => ({
                        ...s,
                        selectedPRs: new Set([...s.selectedPRs, pr.url])
                    }));
                }
            } else {
                const feature = getEmptyFeatures()[state.selectedIndex];
                if (feature) {
                    setState(s => ({
                        ...s,
                        selectedFeatures: new Set([...s.selectedFeatures, feature])
                    }));
                }
            }
        } else if (input === 'p' && state.listType !== 'prs') {
            setState(s => ({ ...s, listType: 'prs', selectedIndex: 0, scrollOffset: 0 }));
        } else if (input === 'f' && state.listType !== 'features') {
            setState(s => ({ ...s, listType: 'features', selectedIndex: 0, scrollOffset: 0 }));
        } else if (key.return) {
            cleanup();
        } else if (key.escape) {
            onSave(existingFeatures);
        }
    });

    if (state.loading) {
        return (
            <Box flexDirection="column" padding={1}>
                <Text color="yellow">Loading PR statuses...</Text>
            </Box>
        );
    }

    if (state.error) {
        return (
            <Box flexDirection="column" padding={1}>
                <Text color="red">Error: {state.error}</Text>
            </Box>
        );
    }

    const renderStatusBar = () => (
        <Box>
            <Text color="gray">[</Text>
            <Text color={state.listType === 'prs' ? 'blue' : 'gray'}>P</Text>
            <Text color="gray">] Closed PRs | [</Text>
            <Text color={state.listType === 'features' ? 'blue' : 'gray'}>F</Text>
            <Text color="gray">] Empty Features</Text>
        </Box>
    );

    const renderPRList = () => {
        const closedPRs = getClosedPRs();
        const visiblePRs = closedPRs.slice(
            state.scrollOffset,
            state.scrollOffset + visibleItems
        );

        return (
            <Box flexDirection="column">
                {visiblePRs.map((pr, index) => {
                    const actualIndex = index + state.scrollOffset;
                    const isSelected = state.selectedPRs.has(pr.url);
                    const isCurrentSelection = actualIndex === state.selectedIndex;

                    const showAuthor = state.currentUser && pr.author && pr.author !== state.currentUser;

                    return (
                        <Box key={pr.url}>
                            <Text color={isCurrentSelection ? 'blue' : 'white'}>
                                {isCurrentSelection ? '>' : ' '}
                                {isSelected ? '[×]' : '[ ]'}
                            </Text>
                            <Box marginLeft={1} width={state.repoColumnWidth}>
                                <Text color="gray">[{padToWidth(pr.repository, state.repoColumnWidth - 2)}]</Text>
                            </Box>
                            <Text color={isSelected ? 'gray' : 'white'}>
                                {pr.title}
                                {showAuthor && <Text color="gray"> by {pr.author}</Text>}
                                <Text color="gray"> {pr.merged ? '(merged)' : '(closed)'}</Text>
                            </Text>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    const renderFeatureList = () => {
        const emptyFeatures = getEmptyFeatures();
        const visibleFeatures = emptyFeatures.slice(
            state.scrollOffset,
            state.scrollOffset + visibleItems
        );

        return (
            <Box flexDirection="column">
                {visibleFeatures.map((feature, index) => {
                    const actualIndex = index + state.scrollOffset;
                    const isSelected = state.selectedFeatures.has(feature);
                    const isCurrentSelection = actualIndex === state.selectedIndex;

                    return (
                        <Box key={feature}>
                            <Text color={isCurrentSelection ? 'blue' : 'white'}>
                                {isCurrentSelection ? '>' : ' '}
                                {isSelected ? '[×]' : '[ ]'}
                            </Text>
                            <Box marginLeft={1}>
                                <Text color={isSelected ? 'gray' : 'white'}>
                                    {feature}
                                </Text>
                                <Text color="yellow"> (empty)</Text>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    };

    return (
        <Box flexDirection="column" padding={1}>
            {renderStatusBar()}
            <Text bold marginTop={1}>Select items to remove (Space to select, Enter to confirm, Esc to cancel)</Text>
            <Box flexDirection="column" marginTop={1}>
                {state.listType === 'prs' ? renderPRList() : renderFeatureList()}
            </Box>
        </Box>
    );
};

export default Cleanup; 