import { useMemo } from "react";
import {
	type Dispatch,
	type ElmOptions,
	init as initElmish,
	type Message,
	type UpdateMap,
	type UseElmishOptions as UseElmishOptionsBase,
	useElmish as useElmishBase,
} from "react-elmish";
import type { UpdateFunction } from "react-elmish/extend";
import { getCurrentFakeDependenciesOnce } from "../Internal";

interface ElmishStateFunction<TProps, TModel, TMessage extends Message> {
	init: UseElmishOptionsBase<TProps, TModel, TMessage>["init"];
	update: UpdateFunction<TProps, TModel, TMessage>;
	subscription?: UseElmishOptionsBase<TProps, TModel, TMessage>["subscription"];
}

interface ElmishStateMap<TProps, TModel, TMessage extends Message> {
	init: UseElmishOptionsBase<TProps, TModel, TMessage>["init"];
	update: UpdateMap<TProps, TModel, TMessage>;
	subscription?: UseElmishOptionsBase<TProps, TModel, TMessage>["subscription"];
}

type ElmishState<TProps, TModel, TMessage extends Message> =
	| ElmishStateFunction<TProps, TModel, TMessage>
	| ElmishStateMap<TProps, TModel, TMessage>;

type UseElmishOptions<TProps, TModel, TMessage extends Message, TDependencies> = Omit<
	UseElmishOptionsBase<TProps, TModel, TMessage>,
	"init" | "update" | "subscription"
> & {
	createState: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>;
};

interface ElmishWithDependencies<TDependencies> {
	useElmish: <TProps, TModel, TMessage extends Message>(
		options: UseElmishOptions<TProps, TModel, TMessage, TDependencies>,
	) => [TModel, Dispatch<TMessage>];
}

function initWithDependencies<TDependencies>(
	initializationOptions: ElmOptions,
	dependencies: TDependencies,
): ElmishWithDependencies<TDependencies> {
	initElmish(initializationOptions);

	return { useElmish };

	function useElmish<TProps, TModel, TMessage extends Message>(
		options: UseElmishOptions<TProps, TModel, TMessage, TDependencies>,
	): [TModel, Dispatch<TMessage>] {
		const { createState, ...rest } = options;

		// biome-ignore lint/correctness/useExhaustiveDependencies: We only want this to run once
		const { init, update, subscription } = useMemo(() => createState(getCurrentFakeDependenciesOnce() ?? dependencies), []);

		return useElmishBase<TProps, TModel, TMessage>({ ...rest, init, update, subscription });
	}
}

export type { ElmishState, ElmishStateFunction, ElmishStateMap };

export { initWithDependencies };
