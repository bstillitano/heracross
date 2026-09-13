// React Native's SPM autolinker reads app-local native modules from the iOS
// app root (this directory), not from the project's react-native.config.js.
module.exports = {
  spm: {
    modules: [
      // The example's own Turbo Module: demo data, location and safe area insets.
      { name: 'HeracrossExampleDemo', path: 'HeracrossExampleDemo' },
    ],
  },
};
