import { Message, UpdateReturnType } from "react-elmish";

type LocalMessage<TSubPage> =
    | { name: "NavigateTo", subPage: TSubPage };

export interface NavigationModel<TSubPage> {
    subPage: Nullable<TSubPage>,
}

export interface Props {}

interface Msg<TSubPage> {
    navigateTo: (subPage: TSubPage) => LocalMessage<TSubPage>,
}

export interface Navigation<TSubPage, TModel extends NavigationModel<TSubPage>, TMessage extends Message> {
    init: () => NavigationModel<TSubPage>,
    update: (model: TModel, msg: TMessage & LocalMessage<TSubPage>) => UpdateReturnType<TModel, NavigationMessage<TMessage, TSubPage>>,
    Msg: Msg<TSubPage>,
}

export type NavigationMessage<TMessage extends Message, TSubPage> = TMessage | LocalMessage<TSubPage>;

export const createNavigation = <TSubPage, TModel extends NavigationModel<TSubPage>, TMessage extends Message>(localUpdate: (model: TModel, msg: TMessage) => UpdateReturnType<TModel, NavigationMessage<TMessage, TSubPage>>): Navigation<TSubPage, TModel, TMessage> => {
    // const cmd = createCmd<LocalMessage<TSubPage>>();

    const Msg = {
        navigateTo: (subPage: TSubPage): LocalMessage<TSubPage> => ({ name: "NavigateTo", subPage }),
    };

    return {
        Msg,
        init (): NavigationModel<TSubPage> {
            return {
                subPage: null,
            };
        },

        update (model: TModel, msg: TMessage & LocalMessage<TSubPage>): UpdateReturnType<TModel, NavigationMessage<TMessage, TSubPage>> {
            switch (msg.name) {
                case "NavigateTo":
                    const isCurrentPage = Navigator.navigateTo(msg.subPage)

                    if (isCurrentPage) {
                        return [{ ...model, subPage: msg.subPage }];
                    }

                    return [{}];

                default:
                    return localUpdate(model, msg);
            }
        },
    };
};