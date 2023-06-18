import * as path from "path";
import { JestConfigWithTsJest } from "ts-jest";

export default {
	collectCoverageFrom: ["<rootDir>/src/**/*.ts", "!<rootDir>/src/**/index.ts"],
	coverageThreshold: { global: { branches: 75, functions: 75, lines: 75, statements: 75 } },
	moduleFileExtensions: ["js", "ts"],
	setupFilesAfterEnv: [path.resolve(__dirname, "./tools/jest/jest-extended.ts")],
	testPathIgnorePatterns: ["/node_modules/", "/dist/"],
	transform: {
		"^.+\\.[tj]s$": [
			"ts-jest",
			{
				tsconfig: "<rootDir>/tsconfig.spec.json"
			}
		]
	},
	transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"]
} satisfies JestConfigWithTsJest;
