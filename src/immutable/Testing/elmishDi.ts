import type { Immutable } from "immer";
import type { Cmd, InitResult, Message, Subscription, UpdateFunctionOptions } from "react-elmish/immutable";
import {
	getConsecutiveUpdateFn,
	getCreateModelAndProps,
	getCreateUpdateArgs,
	getUpdateAndExecCmdFn,
	getUpdateFn,
	type ModelAndPropsFactory,
	type RenderWithModelOptions,
	renderWithModel,
	type UpdateArgsFactory,
} from "react-elmish/immutable/testing";
import { setFakeDependencies } from "../../Internal";
import type { ElmishState } from "../ElmishDi";

interface ElmishStateResult<TProps, TModel, TMessage extends Message> {
	init: (props: TProps) => InitResult<TModel, TMessage>;
	update: (
		msg: TMessage,
		model: Immutable<TModel>,
		props: TProps,
		optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
	) => [Partial<TModel>, ...(Cmd<TMessage> | undefined)[]];
	updateAndExecCmd: (
		msg: TMessage,
		model: Immutable<TModel>,
		props: TProps,
		optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
	) => Promise<[Partial<TModel>, (TMessage | null)[]]>;
	consecutiveUpdate: (
		msg: TMessage,
		model: Immutable<TModel>,
		props: TProps,
		optionsTemplate?: Partial<UpdateFunctionOptions<TProps, TModel, TMessage>>,
	) => Promise<Partial<TModel>>;
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

	return {
		init,
		update: getUpdateFn<TProps, TModel, TMessage>(update),
		updateAndExecCmd: getUpdateAndExecCmdFn<TProps, TModel, TMessage>(update),
		consecutiveUpdate: getConsecutiveUpdateFn<TProps, TModel, TMessage>(update),
		subscription,
		createUpdateArgs: getCreateUpdateArgs(init, initProps),
		createModelAndProps: getCreateModelAndProps(init, initProps),
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
