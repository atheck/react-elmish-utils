import type { InitResult, Message, Subscription, UpdateFunctionOptions, UpdateReturnType } from "react-elmish";
import { createCallBase, createDefer } from "react-elmish/extend";
import {
	execCmd,
	getCreateModelAndProps,
	getCreateUpdateArgs,
	getUpdateAndExecCmdFn,
	getUpdateFn,
	type RenderWithModelOptions,
	renderWithModel,
	type UpdateArgsFactory,
} from "react-elmish/testing";
import type { ElmishState } from "../ElmishDi";
import { setFakeDependencies } from "../Internal";

type ModelAndPropsFactory<TProps, TModel> = (
	modelTemplate?: Partial<TModel>,
	propsTemplate?: Partial<TProps>,
) => [TModel, TProps];

interface ElmishStateResult<TProps, TModel, TMessage extends Message> {
	init: (props: TProps) => InitResult<TModel, TMessage>;
	// eslint-disable-next-line max-params
	update: (
		msg: TMessage,
		model: TModel,
		props: TProps,
		optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
	) => UpdateReturnType<TModel, TMessage>;
	// eslint-disable-next-line max-params
	updateAndExecCmd: (
		msg: TMessage,
		model: TModel,
		props: TProps,
		optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
	) => Promise<[Partial<TModel>, (TMessage | null)[]]>;
	subscription?: Subscription<TProps, TModel, TMessage>;
	createUpdateArgs: UpdateArgsFactory<TProps, TModel, TMessage>;
	createModelAndProps: ModelAndPropsFactory<TProps, TModel>;
}

function getElmishState<TProps, TModel, TMessage extends Message, TDependencies>(
	createState: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>,
	initProps: () => TProps,
	dependencies: TDependencies,
): ElmishStateResult<TProps, TModel, TMessage> {
	const { init, update, subscription } = createState(dependencies);
	const createUpdateArgs = getCreateUpdateArgs(init, initProps);
	const createModelAndProps = getCreateModelAndProps(init, initProps);

	if (typeof update === "function") {
		return {
			init,
			// eslint-disable-next-line max-params
			update(msg, model, props, optionsTemplate) {
				const [defer, getDeferred] = createDefer<TModel, TMessage>();
				const callBase = createCallBase(msg, model, props, { defer });
				const options: UpdateFunctionOptions<TProps, TModel, TMessage> = { defer, callBase, ...optionsTemplate };

				const [updatedModel, ...commands] = update(model, msg, props, options);

				const [deferredModel, deferredCommands] = getDeferred();

				return [{ ...deferredModel, ...updatedModel }, ...commands, ...deferredCommands];
			},
			// eslint-disable-next-line max-params
			async updateAndExecCmd(msg, model, props, optionsTemplate) {
				const [defer, getDeferred] = createDefer<TModel, TMessage>();
				const callBase = createCallBase(msg, model, props, { defer });
				const options: UpdateFunctionOptions<TProps, TModel, TMessage> = { defer, callBase, ...optionsTemplate };

				const [updatedModel, ...commands] = update(model, msg, props, options);
				const [deferredModel, deferredCommands] = getDeferred();
				const messages = await execCmd(...commands, ...deferredCommands);

				return [{ ...deferredModel, ...updatedModel }, messages];
			},
			subscription,
			createUpdateArgs,
			createModelAndProps,
		};
	}

	const updateFn = getUpdateFn(update);
	const updateAndExecCmd = getUpdateAndExecCmdFn(update);

	return {
		init,
		update: updateFn,
		updateAndExecCmd,
		subscription,
		createUpdateArgs,
		createModelAndProps,
	};
}

function getElmishStateFactory<TProps, TModel, TMessage extends Message, TDependencies>(
	createState: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>,
	initProps: () => TProps,
): (dependencies: TDependencies) => ElmishStateResult<TProps, TModel, TMessage> {
	return (dependencies: TDependencies) => getElmishState(createState, initProps, dependencies);
}

interface RenderOptions<TModel, TMessage extends Message, TDependencies> extends RenderWithModelOptions<TMessage> {
	dependencies?: TDependencies;
	model: TModel;
}

function renderWithDependencies<TModel extends object, TMessage extends Message, TDependencies, TResult>(
	render: () => TResult,
	{ dependencies, model, ...rest }: RenderOptions<TModel, TMessage, TDependencies>,
): TResult {
	setFakeDependencies(dependencies);

	return renderWithModel(render, model, rest);
}

function resetDependencies(): void {
	setFakeDependencies(null);
}

export type { ElmishStateResult, RenderOptions };

export { getElmishState, getElmishStateFactory, renderWithDependencies, resetDependencies };
