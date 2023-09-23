import { InitResult, Message, UpdateReturnType } from "react-elmish";
import {
	RenderWithModelOptions,
	UpdateArgsFactory,
	execCmd,
	getCreateModelAndProps,
	getCreateUpdateArgs,
	getUpdateAndExecCmdFn,
	getUpdateFn,
	renderWithModel,
} from "react-elmish/dist/Testing";
import { Subscription } from "react-elmish/dist/useElmish";
import { ElmishState } from "../ElmishDi/elmishDi";
import { setFakeDependencies } from "./fakeDependencies";

type ModelAndPropsFactory<TProps, TModel> = (
	modelTemplate?: Partial<TModel>,
	propsTemplate?: Partial<TProps>,
) => [TModel, TProps];

interface ElmishStateResult<TProps, TModel, TMessage extends Message> {
	init: (props: TProps) => InitResult<TModel, TMessage>;
	update: (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage>;
	updateAndExecCmd: (msg: TMessage, model: TModel, props: TProps) => Promise<[Partial<TModel>, (TMessage | null)[]]>;
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
			update(msg, model, props) {
				return update(model, msg, props);
			},
			async updateAndExecCmd(msg, model, props) {
				const [updatedModel, cmd] = update(model, msg, props);
				const messages = await execCmd(cmd);

				return [updatedModel, messages];
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

	const result = renderWithModel(render, model, rest);

	setFakeDependencies(null);

	return result;
}

export type { ElmishStateResult, RenderOptions };

export { getElmishState, getElmishStateFactory, renderWithDependencies };