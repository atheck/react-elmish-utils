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

export const Msg = {
    reValidate: (): Message => ({ name: "ReValidate", ...Source }),
    accept: (): Message => ({ name: "Accept", ...Source }),
    cancelRequest: (): Message => ({ name: "CancelRequest", ...Source }),
    cancel: (): Message => ({ name: "Cancel", ...Source }),
};

export type Model = Readonly<{
    errors: IValidationError [],
    validated: boolean,
    modified: boolean,
}>;

export type Props<T> = Readonly<{
    onAccept: (data: T) => void,
    onCancel: () => void,
}>;

export type UpdateOptions<T, TModel> = {
    validate?: (model: TModel) => IValidationError [],
    getData: () => T,
    onCancelRequest?: () => UpdateReturnType<TModel, Message>,
};

const cmd = createCmd<Message>();

export const init = (): Model => {
    return {
        errors: [],
        validated: false,
        modified: false,
    };
};

export const update = <T, TModel extends Model>(model: TModel, msg: Message, props: Props<T>, options: UpdateOptions<T, TModel>): UpdateReturnType<TModel, Message> => {
    switch (msg.name) {
        case "ReValidate":
            if (options.validate && model.validated) {
                return [{ ...model, errors: options.validate(model) }];
            }

            return [{}];

        case "Accept": {
            if (options.validate) {
                const errors = options.validate(model);

                if (errors.length > 0) {
                    return [{ ...model, validated: true, errors }];
                }
            }

            props.onAccept(options.getData());

            return [{}];
        }

        case "CancelRequest":
            if (model.modified && options.onCancelRequest) {
                return options.onCancelRequest();
            }

            return [{}, cmd.ofMsg(Msg.cancel())];

        case "Cancel":
            props.onCancel();

            return [{}];
    }
};