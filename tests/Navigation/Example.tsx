import { Cmd, createCmd, UpdateReturnType } from "react-elmish";
import { createNavigation, NavigationMessage, NavigationModel } from "../../src/Navigation/Navigation";

type Message =
    | { name: "Message1" }
    | { name: "Message2" };

type AllMessages = NavigationMessage<Message, SubPage>;

type BaseSubPage =
    | { name: "BaseSubPage1", id: string };

type SubPage =
    | { name: "SubPage1" }
    | { name: "Base", subPages: BaseSubPage };

interface Model extends NavigationModel<SubPage> {}

const navigation = createNavigation<SubPage, Model, Message>(localUpdate);

const { update } = navigation;

const Msg = {
    message1: (): Message => ({ name: "Message1" }),
    ...navigation.Msg,
};

const cmd = createCmd<AllMessages>();

function init (): [Model, Cmd<Message>] {
    return [
        {
            ...navigation.init(),
        },
        cmd.none,
    ];
}

function localUpdate (_model: Model, msg: Message): UpdateReturnType<Model, AllMessages> {
    switch (msg.name) {
        case "Message1":
            return [{}, cmd.ofMsg(Msg.navigateTo({ name: "Base", subPages: { name: "BaseSubPage1", id: "1234" } }))];

        case "Message2":
            return [{}];
    }
}

export { init, update };