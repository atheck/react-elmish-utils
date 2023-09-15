import { InitResult, Message, UpdateReturnType } from "react-elmish";
import { execCmd, getCreateUpdateArgs, getUpdateAndExecCmdFn, getUpdateFn, UpdateArgsFactory } from "react-elmish/dist/Testing";
import { ElmishState } from "../ElmishDi/elmishDi";

interface ElmishStateResult<TProps, TModel, TMessage extends Message> {
    init: (props: TProps) => InitResult<TModel, TMessage>,
    update: (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage>,
    updateAndExecCmd: (msg: TMessage, model: TModel, props: TProps) => Promise<[Partial<TModel>, (TMessage | null) []]>,
    createUpdateArgs: UpdateArgsFactory<TProps, TModel, TMessage>,
}

function getElmishState<TProps, TModel, TMessage extends Message, TDependencies> (
    createState: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>,
    initProps: () => TProps,
    dependencies: TDependencies,
): ElmishStateResult<TProps, TModel, TMessage> {
    const { init, update } = createState(dependencies);
    const createUpdateArgs = getCreateUpdateArgs(init, initProps);

    if (typeof update === "function") {
        return {
            init,
            update (msg, model, props) {
                return update(model, msg, props);
            },
            async updateAndExecCmd (msg, model, props) {
                const [updatedModel, cmd] = update(model, msg, props);
                const messages = await execCmd(cmd);

                return [updatedModel, messages];
            },
            createUpdateArgs,
        };
    }

    const updateFn = getUpdateFn(update);
    const updateAndExecCmd = getUpdateAndExecCmdFn(update);

    return {
        init,
        update: updateFn,
        updateAndExecCmd,
        createUpdateArgs,
    };
}

function getElmishStateFactory<TProps, TModel, TMessage extends Message, TDependencies> (
    createState: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>,
    initProps: () => TProps,
): (dependencies: TDependencies) => ElmishStateResult<TProps, TModel, TMessage> {
    return (dependencies: TDependencies) => getElmishState(createState, initProps, dependencies);
}

export type { ElmishStateResult };

export { getElmishState, getElmishStateFactory };