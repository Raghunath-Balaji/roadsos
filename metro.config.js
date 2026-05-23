const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const {
    resolver: { assetExts, sourceExts },
} = config;

// Ensure gguf is recognized as an asset and NOT as source code
config.resolver.assetExts = [...assetExts, "gguf"];
config.resolver.sourceExts = sourceExts.filter((ext) => ext !== "gguf");

// If you are using the New Architecture (which you have enabled in app.json)
config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
    },
});

module.exports = withNativeWind(config, { input: "./globals.css" });