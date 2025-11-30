import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  transform: { ...tsJestTransformCfg },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1", // Strips .ts and replaces with .js
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
