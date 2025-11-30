// metro.config.js
// Metro 번들러 설정 - 스타일 파일을 라우트에서 제외
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Expo Router가 스타일 파일을 무시하도록 설정
config.resolver.sourceExts = [...config.resolver.sourceExts, "tsx", "ts"];

module.exports = config;

