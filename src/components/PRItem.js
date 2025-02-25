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

    // Review status indicators
    const renderReviewStatus = () => {
        if (!pr.reviews) return null;

        const reviewInfo = [];

        // Show reviewers who requested changes
        if (pr.reviews.changes_requested > 0) {
            reviewInfo.push(
                <Text key="changes" color="red">✗ </Text>,
                <Text key="changes-names" color="gray">{pr.reviews.change_requesters?.join(', ') || ''}</Text>
            );
        }

        // Show pending reviewers (excluding those who approved)
        const pendingReviewers = pr.reviews.reviewers?.filter(reviewer =>
            !pr.reviews.approvers?.includes(reviewer)
        );

        if (pendingReviewers?.length > 0) {
            if (reviewInfo.length > 0) reviewInfo.push(<Text key="separator2"> | </Text>);
            reviewInfo.push(
                <Text key="pending" color="yellow">◯ </Text>,
                <Text key="pending-names" color="gray">{pendingReviewers.join(', ')}</Text>
            );
        }

        if (reviewInfo.length === 0) return null;

        return (
            <Box marginLeft={level > 0 ? 4 : 2}>
                {reviewInfo}
            </Box>
        );
    };

    // Check if PR is fully approved
    const isFullyApproved = pr.reviews &&
        pr.reviews.approved > 0 &&
        pr.reviews.changes_requested === 0 &&
        (!pr.reviews.reviewers?.length ||
            pr.reviews.reviewers.every(reviewer => pr.reviews.approvers?.includes(reviewer)));

    return (
        <Box flexDirection="column">
            <Box>
                {level > 1 && <Text color="gray">{'  '.repeat(level - 1)}</Text>}
                {level > 0 && <Text color="gray">└──</Text>}
                <Text color={stateColor}>{stateIndicator} </Text>
                <Text bold={isBold} color={titleColor}>
                    {createHyperlink(decorateText(pr.title), pr.url)}
                </Text>
                {isFullyApproved && <Text color="green"> ✓</Text>}
            </Box>

            {renderReviewStatus()}

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