import { InitResult, Message, UpdateReturnType } from "react-elmish";
import { execCmd, getUpdateAndExecCmdFn, getUpdateFn } from "react-elmish/dist/Testing";
import { ElmishState } from "../ElmishDi/elmishDi";

interface ElmishStateResult<TProps, TModel, TMessage extends Message> {
    init: (props: TProps) => InitResult<TModel, TMessage>,
    updateFn: (msg: TMessage, model: TModel, props: TProps) => UpdateReturnType<TModel, TMessage>,
    updateAndExecCmdFn: (msg: TMessage, model: TModel, props: TProps) => Promise<[Partial<TModel>, (TMessage | null) []]>,
}

function getElmishState<TProps, TModel, TMessage extends Message, TDependencies> (createState: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>, dependencies: TDependencies): ElmishStateResult<TProps, TModel, TMessage> {
    const { init, update } = createState(dependencies);

    if (typeof update === "function") {
        return {
            init,
            updateFn (msg, model, props) {
                return update(model, msg, props);
            },
            async updateAndExecCmdFn (msg, model, props) {
                const [updatedModel, cmd] = update(model, msg, props);
                const messages = await execCmd(cmd);

                return [updatedModel, messages];
            },
        };
    }

    const updateFn = getUpdateFn(update);
    const updateAndExecCmdFn = getUpdateAndExecCmdFn(update);

    return {
        init,
        updateFn,
        updateAndExecCmdFn,
    };
}

function getElmishStateFactory<TProps, TModel, TMessage extends Message, TDependencies> (createState: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>): (dependencies: TDependencies) => ElmishStateResult<TProps, TModel, TMessage> {
    return (dependencies: TDependencies) => getElmishState(createState, dependencies);
}

export { getElmishState, getElmishStateFactory };