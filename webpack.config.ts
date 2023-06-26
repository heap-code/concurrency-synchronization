import TerserPlugin from "terser-webpack-plugin";
import { BannerPlugin, Configuration } from "webpack";
import nodeExternals from "webpack-node-externals";

import { homepage, license, name, version } from "./package.json";

const [, filename] = name.split("/");
const now = new Date().toISOString().substring(0, 10);

export default [false, true].map<Configuration>(minimize => ({
	devtool: "source-map",
	entry: "./src/index.ts",
	externals: [nodeExternals()],
	mode: "production",
	module: {
		rules: [
			{
				exclude: /node_modules/,
				test: /\.ts$/,
				use: [
					{
						loader: "ts-loader",
						options: {
							configFile: "tsconfig.webpack.json"
						}
					}
				]
			}
		]
	},
	optimization: {
		minimize,
		minimizer: [new TerserPlugin({ extractComments: false })]
	},
	output: {
		filename: `bundles/${filename}.umd${minimize ? ".min" : ""}.js`,
		library: { type: "umd" }
	},
	plugins: [
		new BannerPlugin(
			`${name} v${version} | License: ${license} | Page: ${homepage} | Date: ${now}`
		)
	],
	resolve: { extensions: [".ts", ".js"] }
}));
