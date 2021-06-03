import { createCmd, UpdateReturnType, MsgSource } from "react-elmish";
import { IValidationError } from "../Validation";

type MessageSource = MsgSource<"Form">;

export type Message =
    | { name: "ReValidate" } & MessageSource
    | { name: "Accept" } & MessageSource
    | { name: "CancelRequest" } & MessageSource
    | { name: "Cancel" } & MessageSource
    ;

const Source: MessageSource = { source: "Form" };

export type Model = Readonly<{
    errors: IValidationError [],
    validated: boolean,
}>;

export type FormOptions<TModel, TProps, TData> = {
    getData: (model: TModel, props: TProps) => TData,
    validate?: (model: TModel, props: TProps) => IValidationError [],
    onCancelRequest?: () => UpdateReturnType<TModel, Message>,
};

export type Props<TData> = Readonly<{
    onAccept: (data: TData) => void,
    onCancel: () => void,
}>;

type Msg = {
    reValidate: () => Message,
    accept: () => Message,
    cancelRequest: () => Message,
    cancel: () => Message,
};

type Form<TModel, TProps, TData> = {
    init: () => Model,
    update: (model: Model & TModel, msg: Message, props: Props<TData> & TProps) => UpdateReturnType<Model, Message>,
    Msg: Msg,
}

export const createForm = <TModel, TProps, TData>(options: FormOptions<TModel, TProps, TData>): Form<TModel, TProps, TData> => {
    const cmd = createCmd<Message>();

    const validate = (model: Model & TModel, props: Props<TData> & TProps): IValidationError [] => {
        if (options.validate) {
            const errors = options.validate(model, props);

            return errors;
        }

        return [];
    };

    const Msg = {
        reValidate: (): Message => ({ name: "ReValidate", ...Source }),
        accept: (): Message => ({ name: "Accept", ...Source }),
        cancelRequest: (): Message => ({ name: "CancelRequest", ...Source }),
        cancel: (): Message => ({ name: "Cancel", ...Source }),
    };

    return {
        Msg,
        init: (): Model => {
            return {
                errors: [],
                validated: false,
            };
        },

        update: (model: Model & TModel, msg: Message, props: Props<TData> & TProps): UpdateReturnType<Model, Message> => {
            switch (msg.name) {
                case "ReValidate":
                    if (model.validated) {
                        return [{ ...model, errors: validate(model, props) }];
                    }

                    return [{}];

                case "Accept": {
                    const errors = validate(model, props);

                    if (errors.length > 0) {
                        return [{ ...model, validated: true, errors }];
                    }

                    props.onAccept(options.getData(model, props));

                    return [{}];
                }

                case "CancelRequest":
                    if (options.onCancelRequest) {
                        return options.onCancelRequest();
                    }

                    return [{}, cmd.ofMsg(Msg.cancel())];

                case "Cancel":
                    props.onCancel();

                    return [{}];
            }
        },
    };
};