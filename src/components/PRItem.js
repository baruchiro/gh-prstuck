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

const PRItem = ({ pr, isFirstInRepo }) => {
    const statusColor = getStatusColor(pr.status);

    return (
        <Box flexDirection="column">
            <Text bold color={statusColor}>
                {createHyperlink(pr.title, pr.url)}
            </Text>

            {pr.issues && pr.issues.length > 0 && (
                <Box flexDirection="column" marginLeft={2}>
                    {pr.issues.map((issue, index) => (
                        <Text key={index} color="red">• {issue}</Text>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default PRItem; 