// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
];

// Configure source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'js',
  'jsx',
  'ts',
  'tsx',
  'json',
];

// Configure transformer for TypeScript
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  minifierPath: 'metro-minify-terser',
};

module.exports = config;
