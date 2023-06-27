import * as fs from "fs";
import * as path from "path";

import { name, version } from "../../package.json";

/**
 * Run the after:bump hook command
 */
function bootstrap() {
	const root = path.resolve(__dirname, "../..");

	// Update the version on the CDN URL
	const readmePath = path.resolve(root, "README.md");
	const readmeData = fs.readFileSync(readmePath).toString();

	fs.writeFileSync(
		readmePath,
		readmeData.replace(
			new RegExp(`\\.net/npm\\/${name}@\\d+\\.\\d+\\.\\d+\\/`),
			`.net/npm/${name}@${version}/`
		)
	);
}

bootstrap();
