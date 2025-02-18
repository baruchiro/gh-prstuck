import { Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import { PRHealthController } from '../controllers/pr-health.controller.js';
import PRHealthDisplay from './PRHealthDisplay.js';

const App = ({ prListsFile }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);

    useEffect(() => {
        const loadResults = async () => {
            try {
                const controller = new PRHealthController();
                const healthResults = await controller.checkHealth(prListsFile);
                setResults(healthResults);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadResults();
    }, [prListsFile]);

    if (loading) {
        return (
            <Box>
                <Text color="yellow">Loading PR health status...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Text color="red">Error: {error}</Text>
            </Box>
        );
    }

    return <PRHealthDisplay results={results} />;
};

export default App; 