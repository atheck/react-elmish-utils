interface FakeState {
	currentFakeDependencies: unknown;
}

const State: FakeState = {
	currentFakeDependencies: null,
};

function setFakeDependencies(dependencies: unknown): void {
	State.currentFakeDependencies = dependencies;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- We want this as a cast
function getCurrentFakeDependenciesOnce<TDependencies>(): TDependencies | null {
	return State.currentFakeDependencies as TDependencies | null;
}

export { getCurrentFakeDependenciesOnce, setFakeDependencies };
