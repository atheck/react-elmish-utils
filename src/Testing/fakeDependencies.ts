import { Nullable } from "react-elmish/dist/Types";

let currentFakeDependencies: Nullable<unknown> = null;

function setFakeDependencies<TDependencies>(dependencies: TDependencies): void {
	currentFakeDependencies = dependencies;
}

function getCurrentFakeDependenciesOnce<TDependencies>(): Nullable<TDependencies> {
	const temp = currentFakeDependencies as Nullable<TDependencies>;

	currentFakeDependencies = null;

	return temp;
}

export { getCurrentFakeDependenciesOnce, setFakeDependencies };
