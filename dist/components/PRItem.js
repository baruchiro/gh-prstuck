import { Box, Text } from 'ink';
import React from 'react';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const getStatusColor = status => {
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
const PRItem = ({
  pr,
  isFirstInRepo,
  level = 0
}) => {
  const statusColor = getStatusColor(pr.status);
  const titlePadding = level > 0 ? ('  '.repeat(level - 1) + '└──').length : 0;
  return /*#__PURE__*/_jsxs(Box, {
    flexDirection: "column",
    children: [/*#__PURE__*/_jsxs(Box, {
      children: [level > 1 && /*#__PURE__*/_jsx(Text, {
        color: "gray",
        children: '  '.repeat(level - 1)
      }), level > 0 && /*#__PURE__*/_jsx(Text, {
        color: "gray",
        children: "\u2514\u2500\u2500"
      }), /*#__PURE__*/_jsxs(Text, {
        color: pr.draft ? 'gray' : 'green',
        children: [pr.draft ? '○' : '●', " "]
      }), /*#__PURE__*/_jsx(Text, {
        bold: true,
        color: statusColor,
        children: createHyperlink(pr.title, pr.url)
      })]
    }), pr.issues && pr.issues.length > 0 && /*#__PURE__*/_jsx(Box, {
      flexDirection: "column",
      marginLeft: 2 + titlePadding,
      children: pr.issues.map((issue, index) => /*#__PURE__*/_jsxs(Text, {
        color: "red",
        children: ["\u2022 ", issue]
      }, index))
    })]
  });
};
export default PRItem;