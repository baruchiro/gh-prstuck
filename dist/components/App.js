import { Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import { PRHealthController } from '../controllers/pr-health.controller.js';
import PRHealthDisplay from './PRHealthDisplay.js';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const App = ({
  prListsFile
}) => {
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
    return /*#__PURE__*/_jsx(Box, {
      children: /*#__PURE__*/_jsx(Text, {
        color: "yellow",
        children: "Loading PR health status..."
      })
    });
  }
  if (error) {
    return /*#__PURE__*/_jsx(Box, {
      children: /*#__PURE__*/_jsxs(Text, {
        color: "red",
        children: ["Error: ", error]
      })
    });
  }
  return /*#__PURE__*/_jsx(PRHealthDisplay, {
    results: results
  });
};
export default App;