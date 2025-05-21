let currentFakeDependencies: unknown = null;

function setFakeDependencies(dependencies: unknown): void {
	currentFakeDependencies = dependencies;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- We want this as a cast
function getCurrentFakeDependenciesOnce<TDependencies>(): TDependencies | null {
	return currentFakeDependencies as TDependencies | null;
}

export { getCurrentFakeDependenciesOnce, setFakeDependencies };
