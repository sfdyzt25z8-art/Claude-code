// Metro config for the Organizer mobile app.
//
// This app lives inside an npm-workspaces monorepo and depends on the
// `@organizer/shared` package (raw TypeScript source, not a pre-built
// dist). Metro needs to be told to:
//   1. Watch the shared package's folder (and the repo root) so changes
//      there are picked up and so Metro can find/transpile the .ts files
//      Expo's Babel/Metro pipeline can transpile TS living outside
//      `node_modules` without a separate build step, as long as the folder
//      is inside `watchFolders`.
//   2. Resolve node_modules from the repo root as well as this app's own
//      node_modules, since npm workspaces hoist shared deps to the root.
const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const sharedRoot = path.resolve(workspaceRoot, "packages/shared");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [sharedRoot, workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Avoid resolving duplicate copies of react/react-native from the shared
// package's own node_modules (it doesn't have RN deps, but keep resolution
// deterministic in a hoisted workspace install).
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
