import { Box, Text } from 'ink';
import React from 'react';
import PRItem from './PRItem.js';

// Group PRs by repository within a feature
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const groupPRsByRepo = prs => {
  const grouped = {};
  prs.forEach(pr => {
    const repo = pr.url.split('/')[4];
    if (!grouped[repo]) {
      grouped[repo] = [];
    }
    grouped[repo].push(pr);
  });
  return grouped;
};

// Pad string to fixed width
const padToWidth = (str, width) => {
  if (str.length >= width) {
    return str.slice(0, width);
  }
  return str.padEnd(width, ' ');
};
const REPO_COLUMN_WIDTH = 25;

// Build PR hierarchy tree
const buildPRTree = prs => {
  const prMap = new Map(prs.map(pr => [pr.url, {
    ...pr,
    children: []
  }]));
  const roots = [];
  prMap.forEach(pr => {
    if (pr.parentPrUrl && prMap.has(pr.parentPrUrl)) {
      prMap.get(pr.parentPrUrl).children.push(pr);
    } else {
      roots.push(pr);
    }
  });
  return roots;
};

// Render PR tree recursively
const renderPRTree = (pr, level = 0) => {
  return /*#__PURE__*/_jsxs(Box, {
    flexDirection: "column",
    children: [/*#__PURE__*/_jsx(PRItem, {
      pr: pr,
      level: level
    }), pr.children.map(child => renderPRTree(child, level + 1))]
  }, pr.url);
};
const PRHealthDisplay = ({
  results
}) => {
  return /*#__PURE__*/_jsx(Box, {
    flexDirection: "column",
    padding: 1,
    children: Object.entries(results).map(([feature, prs]) => /*#__PURE__*/_jsxs(Box, {
      flexDirection: "column",
      marginBottom: 1,
      children: [/*#__PURE__*/_jsx(Text, {
        bold: true,
        color: "blue",
        children: feature
      }), Object.entries(groupPRsByRepo(prs)).map(([repo, repoPRs]) => /*#__PURE__*/_jsx(Box, {
        flexDirection: "column",
        children: /*#__PURE__*/_jsxs(Box, {
          marginLeft: 2,
          children: [/*#__PURE__*/_jsx(Text, {
            color: "gray",
            children: padToWidth(repo, REPO_COLUMN_WIDTH)
          }), /*#__PURE__*/_jsx(Box, {
            flexDirection: "column",
            children: buildPRTree(repoPRs).map(pr => renderPRTree(pr))
          })]
        })
      }, repo))]
    }, feature))
  });
};
export default PRHealthDisplay;