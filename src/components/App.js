import { Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import { PRHealthStore } from '../stores/pr-health.store.js';
import PRHealthDisplay from './PRHealthDisplay.js';

const App = ({ prListsFile }) => {
    const [state, setState] = useState({
        loading: true,
        error: null,
        results: {}
    });

    useEffect(() => {
        const store = new PRHealthStore();

        // Subscribe to store updates
        store.on('stateChanged', (newState) => {
            setState(newState);
        });

        // Start loading PR health data
        store.checkHealth(prListsFile);

        // Cleanup subscription
        return () => {
            store.removeAllListeners('stateChanged');
        };
    }, [prListsFile]);

    return (
        <Box flexDirection="column" padding={1}>
            {state.loading && (
                <Box>
                    <Text color="yellow">Loading PR health status...</Text>
                </Box>
            )}

            {state.error && (
                <Box>
                    <Text color="red">Error: {state.error}</Text>
                </Box>
            )}

            {Object.keys(state.results).length > 0 && (
                <PRHealthDisplay results={state.results} />
            )}
        </Box>
    );
};

export default App; 