import { Box, Text, useInput, useStdout } from 'ink';
import React, { useEffect, useState } from 'react';
import { GitHubService } from '../services/github.service.js';

const padToWidth = (str, width) => {
    if (str.length >= width) {
        return str.slice(0, width);
    }
    return str.padEnd(width, ' ');
};

const PRSelector = ({ existingFeatures, onSave }) => {
    const { stdout } = useStdout();
    // Reserve 5 lines for UI elements (title, messages, etc)
    const visibleItems = stdout.rows - 5;

    // Track selected PRs in state instead of recalculating
    const [state, setState] = useState({
        loading: true,
        error: null,
        prs: [],
        features: Object.keys(existingFeatures),
        selectedPR: 0,
        scrollOffset: 0,
        mode: 'pr', // 'pr' or 'feature'
        newFeature: '',
        selectedFeature: 0,
        repoColumnWidth: 20,
        selectedPRs: new Set(Object.values(existingFeatures).flat()), // Track selected PRs in state
        updatedFeatures: existingFeatures // Track feature updates locally
    });

    // Find next available PR
    const findNextAvailablePR = (currentIndex, direction = 1) => {
        const prs = state.prs;
        let nextIndex = currentIndex;

        while (true) {
            nextIndex += direction;
            if (nextIndex < 0 || nextIndex >= prs.length) return currentIndex;
            if (!state.selectedPRs.has(prs[nextIndex].url)) return nextIndex;
        }
    };

    useEffect(() => {
        const loadPRs = async () => {
            try {
                const github = new GitHubService();
                const prs = await github.getMyPRs();
                // Calculate maximum repository name length
                const maxRepoLength = Math.min(
                    30, // max allowed
                    Math.max(10, // min width
                        ...prs.map(pr => pr.repository.length)
                    )
                );

                // Find first unselected PR
                let initialSelectedPR = 0;
                for (let i = 0; i < prs.length; i++) {
                    if (!state.selectedPRs.has(prs[i].url)) {
                        initialSelectedPR = i;
                        break;
                    }
                }

                setState(s => ({
                    ...s,
                    loading: false,
                    prs,
                    selectedPR: initialSelectedPR,
                    repoColumnWidth: maxRepoLength + 2 // +2 for brackets
                }));
            } catch (error) {
                setState(s => ({ ...s, loading: false, error: error.message }));
            }
        };

        loadPRs();
    }, []);

    // Adjust scroll offset when selection changes
    useEffect(() => {
        if (state.mode === 'pr') {
            if (state.selectedPR < state.scrollOffset) {
                setState(s => ({ ...s, scrollOffset: state.selectedPR }));
            } else if (state.selectedPR >= state.scrollOffset + visibleItems) {
                setState(s => ({ ...s, scrollOffset: state.selectedPR - visibleItems + 1 }));
            }
        } else if (state.mode === 'feature') {
            if (state.selectedFeature < state.scrollOffset) {
                setState(s => ({ ...s, scrollOffset: state.selectedFeature }));
            } else if (state.selectedFeature >= state.scrollOffset + visibleItems) {
                setState(s => ({ ...s, scrollOffset: state.selectedFeature - visibleItems + 1 }));
            }
        }
    }, [state.selectedPR, state.selectedFeature, state.mode, visibleItems]);

    useInput((input, key) => {
        if (state.mode === 'pr') {
            if (key.upArrow) {
                setState(s => ({
                    ...s,
                    selectedPR: findNextAvailablePR(s.selectedPR, -1)
                }));
            } else if (key.downArrow) {
                setState(s => ({
                    ...s,
                    selectedPR: findNextAvailablePR(s.selectedPR, 1)
                }));
            } else if (key.return) {
                const pr = state.prs[state.selectedPR];
                if (!state.selectedPRs.has(pr.url)) {
                    setState(s => ({ ...s, mode: 'feature', scrollOffset: 0 }));
                }
            } else if (key.escape) {
                onSave(state.updatedFeatures);
            }
        } else if (state.mode === 'feature') {
            if (key.upArrow) {
                setState(s => ({ ...s, selectedFeature: Math.max(0, s.selectedFeature - 1) }));
            } else if (key.downArrow) {
                setState(s => ({
                    ...s,
                    selectedFeature: Math.min(s.features.length, s.selectedFeature + 1)
                }));
            } else if (key.return) {
                const pr = state.prs[state.selectedPR];
                if (state.selectedFeature === state.features.length) {
                    setState(s => ({ ...s, mode: 'newFeature', newFeature: '' }));
                } else {
                    const feature = state.features[state.selectedFeature];
                    const updatedFeatures = {
                        ...state.updatedFeatures,
                        [feature]: [
                            ...(state.updatedFeatures[feature] || []),
                            pr.url
                        ]
                    };
                    // Update local state only
                    setState(s => ({
                        ...s,
                        mode: 'pr',
                        selectedPRs: new Set([...s.selectedPRs, pr.url]),
                        selectedPR: findNextAvailablePR(s.selectedPR, 1),
                        updatedFeatures: updatedFeatures // Update features locally
                    }));
                }
            } else if (key.escape) {
                setState(s => ({ ...s, mode: 'pr', scrollOffset: 0 }));
            }
        } else if (state.mode === 'newFeature') {
            if (key.return && state.newFeature) {
                const pr = state.prs[state.selectedPR];
                const updatedFeatures = {
                    ...state.updatedFeatures,
                    [state.newFeature]: [pr.url]
                };
                // Update local state only
                setState(s => ({
                    ...s,
                    mode: 'pr',
                    features: [...s.features, state.newFeature],
                    selectedPRs: new Set([...s.selectedPRs, pr.url]),
                    selectedPR: findNextAvailablePR(s.selectedPR, 1),
                    updatedFeatures: updatedFeatures // Update features locally
                }));
            } else if (key.escape) {
                setState(s => ({ ...s, mode: 'feature' }));
            } else if (key.backspace || key.delete) {
                setState(s => ({
                    ...s,
                    newFeature: s.newFeature.slice(0, -1)
                }));
            } else if (input && !key.ctrl && !key.meta && !key.return) {
                setState(s => ({
                    ...s,
                    newFeature: s.newFeature + input
                }));
            }
        }
    });

    if (state.loading) {
        return (
            <Box>
                <Text color="yellow">Loading your PRs...</Text>
            </Box>
        );
    }

    if (state.error) {
        return (
            <Box>
                <Text color="red">Error: {state.error}</Text>
            </Box>
        );
    }

    const renderList = (items, selectedIndex, renderItem) => {
        const visibleItems = items.slice(state.scrollOffset, state.scrollOffset + stdout.rows - 5);
        const hasMore = state.scrollOffset + stdout.rows - 5 < items.length;

        return (
            <Box flexDirection="column">
                {visibleItems.map((item, index) => renderItem(item, index + state.scrollOffset))}
                {hasMore && <Text color="gray">↓ More items below...</Text>}
            </Box>
        );
    };

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold>Select a PR to organize (↑↓ to move, Enter to select, Esc to save)</Text>
            <Box flexDirection="column" marginTop={1}>
                {state.mode === 'pr' && renderList(
                    state.prs,
                    state.selectedPR,
                    (pr, index) => {
                        const isSelected = state.selectedPRs.has(pr.url);
                        const isCurrentSelection = index === state.selectedPR;
                        let textColor = 'white';
                        if (isSelected) textColor = 'gray';
                        else if (isCurrentSelection) textColor = 'blue';

                        return (
                            <Box key={pr.url}>
                                <Text color={textColor}>
                                    {isCurrentSelection ? '>' : ' '}
                                </Text>
                                <Box marginLeft={1} width={state.repoColumnWidth}>
                                    <Text color="gray">[{padToWidth(pr.repository, state.repoColumnWidth - 2)}]</Text>
                                </Box>
                                <Text color={textColor}>
                                    {pr.title} {isSelected && <Text color="yellow">(already in a feature)</Text>}
                                </Text>
                            </Box>
                        );
                    }
                )}

                {state.mode === 'feature' && (
                    <Box flexDirection="column" marginTop={1}>
                        <Text bold>Select a feature:</Text>
                        {renderList(
                            [...state.features, '+ New Feature'],
                            state.selectedFeature,
                            (feature, index) => (
                                <Text key={feature} color={index === state.selectedFeature ? 'blue' : 'white'}>
                                    {index === state.selectedFeature ? '>' : ' '} {feature}
                                </Text>
                            )
                        )}
                    </Box>
                )}

                {state.mode === 'newFeature' && (
                    <Box flexDirection="column" marginTop={1}>
                        <Text bold>Enter new feature name:</Text>
                        <Text>{state.newFeature}</Text>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default PRSelector; 