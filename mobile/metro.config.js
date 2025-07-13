const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript paths
config.resolver.alias = {
  '@': './src',
  '@/types': './src/types',
  '@/services': './src/services',
  '@/components': './src/components',
  '@/screens': './src/screens',
  '@/navigation': './src/navigation',
  '@/constants': './src/constants',
  '@/utils': './src/utils',
  '@/contexts': './src/contexts',
};

module.exports = config;
