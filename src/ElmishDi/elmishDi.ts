import { useMemo } from "react";
import {
	Dispatch,
	ElmOptions,
	Message,
	UseElmishOptions as UseElmishOptionsBase,
	init as initElmish,
	useElmish as useElmishBase,
} from "react-elmish";
import { UpdateFunction, UpdateMap } from "react-elmish/dist/Types";

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
	options: ElmOptions,
	dependencies: TDependencies,
): ElmishWithDependencies<TDependencies> {
	initElmish(options);

	return { useElmish };

	function useElmish<TProps, TModel, TMessage extends Message>({
		name,
		props,
		createState,
	}: UseElmishOptions<TProps, TModel, TMessage, TDependencies>): [TModel, Dispatch<TMessage>] {
		const { init, update, subscription } = useMemo(() => createState(dependencies), [createState]);

		return useElmishBase<TProps, TModel, TMessage>({ name, props, init, update, subscription });
	}
}

export type { ElmishState, ElmishStateFunction, ElmishStateMap };

export { initWithDependencies };
