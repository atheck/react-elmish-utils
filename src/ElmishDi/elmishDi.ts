import { useMemo } from "react";
import { Dispatch, ElmOptions, init as initElmish, Message, useElmish as useElmishBase, UseElmishOptions as UseElmishOptionsBase } from "react-elmish";

interface ElmishState<TProps, TModel, TMessage extends Message> {
    init: UseElmishOptionsBase<TProps, TModel, TMessage>["init"],
    update: UseElmishOptionsBase<TProps, TModel, TMessage>["update"],
    subscription?: UseElmishOptionsBase<TProps, TModel, TMessage>["subscription"],
}

type UseElmishOptions<TProps, TModel, TMessage extends Message, TDependencies> =
    Omit<UseElmishOptionsBase<TProps, TModel, TMessage>, "init" | "update" | "subscription"> & {
        create: (dependencies: TDependencies) => ElmishState<TProps, TModel, TMessage>,
    };

interface ElmishWithDependencies<TDependencies> {
    useElmish: <TProps, TModel, TMessage extends Message>(options: UseElmishOptions<TProps, TModel, TMessage, TDependencies>) => [TModel, Dispatch<TMessage>],
}

function initWithDependencies<TDependencies> (options: ElmOptions, dependencies: TDependencies): ElmishWithDependencies<TDependencies> {
    initElmish(options);

    return { useElmish };

    function useElmish<TProps, TModel, TMessage extends Message> ({ name, props, create }: UseElmishOptions<TProps, TModel, TMessage, TDependencies>): [TModel, Dispatch<TMessage>] {
        const { init, update, subscription } = useMemo(() => create(dependencies), [create]);

        return useElmishBase<TProps, TModel, TMessage>({ name, props, init, update, subscription });
    }
}

export type { ElmishState };

export { initWithDependencies };