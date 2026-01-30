const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Deduplicate Three.js to avoid "Multiple instances" warning and TypeErrors
// This ensures every import of 'three' (even from node_modules) points to the same instance
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'three': path.resolve(__dirname, 'node_modules/three'),
};

config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
];

config.resolver.assetExts.push('ldr');

module.exports = config;
