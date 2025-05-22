import { Box, Text, useInput } from 'ink';
import React, { useEffect, useState } from 'react';
import { PRHealthStore } from '../stores/pr-health.store.js';
import PRHealthDisplay from './PRHealthDisplay.js';

const App = ({ prListsFile }) => {
    const [state, setState] = useState({
        loading: true,
        error: null,
        results: {}
    });
    const [refreshKey, setRefreshKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const storeRef = React.useRef();

    useEffect(() => {
        const store = new PRHealthStore();
        storeRef.current = store;
        store.on('stateChanged', (newState) => {
            setState(newState);
            if (newState.loading) {
                setRefreshing(true);
            } else {
                setRefreshing(false);
            }
        });
        store.checkHealth(prListsFile);
        return () => {
            store.removeAllListeners('stateChanged');
        };
    }, [prListsFile, refreshKey]);

    useInput((input, key) => {
        if ((input === 'r' || input === 'R') && !state.loading) {
            setRefreshing(true);
            setRefreshKey(k => k + 1);
        }
    });

    return (
        <Box flexDirection="column" padding={1}>
            <Box marginBottom={1}>
                <Text color="gray">Press <Text color="cyan">r</Text> to refresh</Text>
            </Box>
            {(state.loading || refreshing) && (
                <Box>
                    <Text color="yellow">{refreshing ? 'Refreshing...' : 'Loading PR health status...'}</Text>
                </Box>
            )}
            {state.error && (
                <Box>
                    <Text color="red">Error: {state.error}</Text>
                </Box>
            )}
            {Object.keys(state.results).length > 0 && !state.loading && !refreshing && (
                <PRHealthDisplay results={state.results} />
            )}
        </Box>
    );
};

export default App; 