import { Box, Text } from 'ink';
import React from 'react';

const getDependencyChain = (features, featureName, visited = new Set()) => {
    if (visited.has(featureName)) return [];
    visited.add(featureName);

    const feature = features[featureName];
    if (!feature) return [];

    const chain = [featureName];
    for (const dep of feature.dependencies) {
        chain.push(...getDependencyChain(features, dep, visited));
    }
    return chain;
};

const getDependentFeatures = (features, targetFeature) => {
    return Object.entries(features)
        .filter(([name, feature]) =>
            feature.dependencies.includes(targetFeature))
        .map(([name]) => name);
};

const FeatureHierarchyDisplay = ({ features, featureName }) => {
    const feature = features[featureName];
    if (!feature) return null;

    const dependencyChain = getDependencyChain(features, featureName);
    const dependentFeatures = getDependentFeatures(features, featureName);

    return (
        <Box flexDirection="column">
            {feature.dependencies.length > 0 && (
                <Box flexDirection="column" marginLeft={2}>
                    <Text color="gray">↑ Depends on:</Text>
                    {feature.dependencies.map(dep => (
                        <Box key={dep} marginLeft={2}>
                            <Text color="blue">└── {dep}</Text>
                        </Box>
                    ))}
                </Box>
            )}

            {dependentFeatures.length > 0 && (
                <Box flexDirection="column" marginLeft={2}>
                    <Text color="gray">↓ Required by:</Text>
                    {dependentFeatures.map(dep => (
                        <Box key={dep} marginLeft={2}>
                            <Text color="magenta">└── {dep}</Text>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default FeatureHierarchyDisplay; 