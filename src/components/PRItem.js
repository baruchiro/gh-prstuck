import { Box, Text } from 'ink';
import React from 'react';

const getStatusColor = (status) => {
    switch (status) {
        case 'HEALTHY':
            return 'green';
        case 'UNHEALTHY':
            return 'red';
        case 'ERROR':
            return 'yellow';
        default:
            return 'white';
    }
};

// Create a clickable link in the terminal
const createHyperlink = (text, url) => {
    return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
};

const PRItem = ({ pr, isFirstInRepo, level = 0 }) => {
    const statusColor = getStatusColor(pr.status);
    const titlePadding = level > 0 ? ('  '.repeat(level - 1) + '└──').length : 0;

    // Determine PR state indicator and color
    let stateIndicator = pr.draft ? '○' : '●';  // Keep draft indicator separate
    let stateColor = pr.draft ? 'gray' : 'green';
    let titleColor = statusColor;
    let isBold = true;
    let titleDecorator = '';

    if (pr.merged) {
        stateIndicator = '✓';
        stateColor = '#2E8B57'; // Sea green - more muted but still clearly "success"
        titleColor = '#708090'; // Slate gray - readable but de-emphasized
        isBold = false;
    } else if (pr.state === 'closed') {
        stateIndicator = '×';
        stateColor = 'gray';
        titleColor = 'gray';
        titleDecorator = '\u0336'; // Add strikethrough by inserting this character between each character
    }

    const decorateText = (text) => {
        if (!titleDecorator) return text;
        return text.split('').join(titleDecorator) + titleDecorator;
    };

    return (
        <Box flexDirection="column">
            <Box>
                {level > 1 && <Text color="gray">{'  '.repeat(level - 1)}</Text>}
                {level > 0 && <Text color="gray">└──</Text>}
                <Text color={stateColor}>{stateIndicator} </Text>
                <Text bold={isBold} color={titleColor}>
                    {createHyperlink(decorateText(pr.title), pr.url)}
                </Text>
            </Box>

            {pr.issues && pr.issues.length > 0 && (
                <Box flexDirection="column" marginLeft={2 + titlePadding}>
                    {pr.issues.map((issue, index) => (
                        <Text key={index} color="red">• {issue}</Text>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default PRItem; 