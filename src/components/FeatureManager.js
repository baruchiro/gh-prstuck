import { Box, Text, useInput, useStdout } from 'ink';
import React, { useState } from 'react';

const FeatureManager = ({ existingFeatures, onSave }) => {
    const { stdout } = useStdout();
    const visibleItems = stdout.rows - 5;

    const [state, setState] = useState({
        features: Object.keys(existingFeatures.Features || {}),
        selectedFeature: 0,
        selectedDependencyIndex: 0,
        scrollOffset: 0,
        mode: 'list', // list, new, dependencies
        newFeature: '',
        currentFeature: null,
        updatedFeatures: existingFeatures
    });

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

    useInput((input, key) => {
        if (state.mode === 'list') {
            if (key.upArrow) {
                setState(s => ({ ...s, selectedFeature: Math.max(0, s.selectedFeature - 1) }));
            } else if (key.downArrow) {
                setState(s => ({
                    ...s,
                    selectedFeature: Math.min(s.features.length, s.selectedFeature + 1)
                }));
            } else if (key.return) {
                if (state.selectedFeature === state.features.length) {
                    setState(s => ({ ...s, mode: 'new', newFeature: '' }));
                } else {
                    const feature = state.features[state.selectedFeature];
                    setState(s => ({
                        ...s,
                        mode: 'dependencies',
                        currentFeature: feature,
                        selectedDependencyIndex: 0,
                        scrollOffset: 0
                    }));
                }
            } else if (key.escape) {
                onSave(state.updatedFeatures);
            }
        } else if (state.mode === 'new') {
            if (key.return && state.newFeature) {
                const updatedFeatures = {
                    ...state.updatedFeatures,
                    Features: {
                        ...state.updatedFeatures.Features,
                        [state.newFeature]: {
                            prs: [],
                            dependencies: []
                        }
                    }
                };
                setState(s => ({
                    ...s,
                    mode: 'list',
                    features: [...s.features, state.newFeature],
                    updatedFeatures: updatedFeatures
                }));
            } else if (key.escape) {
                setState(s => ({ ...s, mode: 'list' }));
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
        } else if (state.mode === 'dependencies') {
            const availableDependencies = state.features.filter(f => f !== state.currentFeature);
            const currentDependencies = new Set(state.updatedFeatures.Features[state.currentFeature]?.dependencies || []);

            if (key.upArrow) {
                setState(s => ({
                    ...s,
                    selectedDependencyIndex: Math.max(0, s.selectedDependencyIndex - 1)
                }));
            } else if (key.downArrow) {
                setState(s => ({
                    ...s,
                    selectedDependencyIndex: Math.min(availableDependencies.length - 1, s.selectedDependencyIndex + 1)
                }));
            } else if (input === ' ') {
                const targetFeature = availableDependencies[state.selectedDependencyIndex];
                const newDependencies = new Set(currentDependencies);

                if (newDependencies.has(targetFeature)) {
                    newDependencies.delete(targetFeature);
                } else {
                    newDependencies.add(targetFeature);
                }

                const updatedFeatures = {
                    ...state.updatedFeatures,
                    Features: {
                        ...state.updatedFeatures.Features,
                        [state.currentFeature]: {
                            ...state.updatedFeatures.Features[state.currentFeature],
                            dependencies: Array.from(newDependencies)
                        }
                    }
                };

                setState(s => ({
                    ...s,
                    updatedFeatures: updatedFeatures
                }));
            } else if (key.escape) {
                setState(s => ({
                    ...s,
                    mode: 'list',
                    currentFeature: null,
                    selectedDependencyIndex: 0,
                    scrollOffset: 0
                }));
            }
        }
    });

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold>Feature Hierarchy Manager</Text>
            <Text>Press Enter to manage dependencies, Space to toggle, Esc to save</Text>

            <Box flexDirection="column" marginTop={1}>
                {state.mode === 'list' && (
                    <Box flexDirection="column">
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

                {state.mode === 'dependencies' && (
                    <Box flexDirection="column">
                        <Text bold>Managing dependencies for {state.currentFeature}</Text>
                        {renderList(
                            state.features.filter(f => f !== state.currentFeature),
                            state.selectedDependencyIndex,
                            (feature, index) => {
                                const isSelected = state.updatedFeatures.Features[state.currentFeature]?.dependencies?.includes(feature);
                                return (
                                    <Text key={feature} color={index === state.selectedDependencyIndex ? 'blue' : 'white'}>
                                        {index === state.selectedDependencyIndex ? '>' : ' '}
                                        [{isSelected ? 'x' : ' '}] {feature}
                                    </Text>
                                );
                            }
                        )}
                    </Box>
                )}

                {state.mode === 'new' && (
                    <Box flexDirection="column">
                        <Text bold>Enter new feature name:</Text>
                        <Text>{state.newFeature}</Text>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default FeatureManager; 