import { Nullable } from "react-elmish/dist/Types";

let currentFakeDependencies: Nullable<unknown> = null;

function setFakeDependencies<TDependencies>(dependencies: TDependencies): void {
	currentFakeDependencies = dependencies;
}

function getCurrentFakeDependenciesOnce<TDependencies>(): Nullable<TDependencies> {
	return currentFakeDependencies as Nullable<TDependencies>;
}

export { getCurrentFakeDependenciesOnce, setFakeDependencies };
