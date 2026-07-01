import nodeWithBiome from "eslint-config-heck/nodeWithBiome";

// biome-ignore lint/style/noDefaultExport: Required for ESLint
export default [
	...nodeWithBiome,
	{
		rules: {
			"react-hooks/exhaustive-deps": "off",
			"@typescript-eslint/no-unsafe-type-assertion": "off",
			"unicorn/consistent-boolean-name": "off",
		},
	},
];
