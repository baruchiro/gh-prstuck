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
    const visibleItems = stdout.rows - 5;

    const [state, setState] = useState({
        loading: true,
        error: null,
        prs: [],
        features: Object.keys(existingFeatures),
        selectedPR: 0,
        scrollOffset: 0,
        mode: 'pr',
        newFeature: '',
        selectedFeature: 0,
        repoColumnWidth: 20,
        selectedPRs: new Set(Object.values(existingFeatures).flat()),
        updatedFeatures: existingFeatures,
        listType: 'authored' // 'authored' or 'review' or 'assigned'
    });

    const findNextAvailablePR = (currentIndex, direction = 1) => {
        let nextIndex = currentIndex;

        while (true) {
            nextIndex += direction;
            if (nextIndex < 0 || nextIndex >= state.prs.length) return currentIndex;
            if (!state.selectedPRs.has(state.prs[nextIndex].url)) return nextIndex;
        }
    };

    const loadPRs = async (type) => {
        setState(s => ({ ...s, loading: true, error: null }));
        try {
            const github = new GitHubService();
            const prs = await (
                type === 'authored' ? github.getMyPRs() :
                    type === 'review' ? github.getPRsToReview() :
                        github.getAssignedPRs()
            );

            const maxRepoLength = Math.min(
                30,
                Math.max(10,
                    ...prs.map(pr => pr.repository.length)
                )
            );

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
                scrollOffset: 0,
                repoColumnWidth: maxRepoLength + 2
            }));
        } catch (error) {
            setState(s => ({ ...s, loading: false, error: error.message }));
        }
    };

    useEffect(() => {
        loadPRs(state.listType);
    }, [state.listType]);

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
            } else if (input === 'a' && state.listType !== 'authored') {
                setState(s => ({ ...s, listType: 'authored' }));
            } else if (input === 'r' && state.listType !== 'review') {
                setState(s => ({ ...s, listType: 'review' }));
            } else if (input === 's' && state.listType !== 'assigned') {
                setState(s => ({ ...s, listType: 'assigned' }));
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
                    setState(s => ({
                        ...s,
                        mode: 'pr',
                        selectedPRs: new Set([...s.selectedPRs, pr.url]),
                        selectedPR: findNextAvailablePR(s.selectedPR, 1),
                        updatedFeatures: updatedFeatures
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
                setState(s => ({
                    ...s,
                    mode: 'pr',
                    features: [...s.features, state.newFeature],
                    selectedPRs: new Set([...s.selectedPRs, pr.url]),
                    selectedPR: findNextAvailablePR(s.selectedPR, 1),
                    updatedFeatures: updatedFeatures
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

    const renderStatusBar = () => (
        <Box>
            <Text color="gray">[</Text>
            <Text color={state.listType === 'authored' ? 'blue' : 'gray'}>A</Text>
            <Text color="gray">] Authored | [</Text>
            <Text color={state.listType === 'review' ? 'blue' : 'gray'}>R</Text>
            <Text color="gray">] Review | [</Text>
            <Text color={state.listType === 'assigned' ? 'blue' : 'gray'}>S</Text>
            <Text color="gray">] Assigned</Text>
        </Box>
    );

    if (state.loading) {
        return (
            <Box flexDirection="column" padding={1}>
                {renderStatusBar()}
                <Box marginTop={1}>
                    <Text color="yellow">Loading PRs...</Text>
                </Box>
            </Box>
        );
    }

    if (state.error) {
        return (
            <Box flexDirection="column" padding={1}>
                {renderStatusBar()}
                <Box marginTop={1}>
                    <Text color="red">Error: {state.error}</Text>
                </Box>
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
            {renderStatusBar()}
            <Text bold marginTop={1}>Select a PR to organize (↑↓ to move, Enter to select, Esc to save)</Text>
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