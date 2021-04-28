import { createCmd, UpdateReturnType, MsgSource } from "react-elmish";
import { runValidation, IValidationError, Validator } from "../Validation";

type MessageSource = MsgSource<"Form">;

export type Message =
    | { name: "ReValidate" } & MessageSource
    | { name: "Accept" } & MessageSource
    | { name: "Cancel" } & MessageSource
    | { name: "ExecCancel" } & MessageSource
    ;

const Source: MessageSource = { source: "Form" };

export const Msg = {
    reValidate: (): Message => ({ name: "ReValidate", ...Source }),
    accept: (): Message => ({ name: "Accept", ...Source }),
    cancel: (): Message => ({ name: "Cancel", ...Source }),
    execCancel: (): Message => ({ name: "ExecCancel", ...Source }),
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
    getData: () => T,
    validate?: (model: TModel) => IValidationError [],
    validators?: Validator [],
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
            if (model.validated) {
                return [{ ...model, errors: validate(model, options) }];
            }

            return [{}];

        case "Accept": {
            const errors = validate(model, options);

            if (errors.length > 0) {
                return [{ ...model, validated: true, errors }];
            }

            props.onAccept(options.getData());

            return [{}];
        }

        case "Cancel":
            if (model.modified && options.onCancelRequest) {
                return options.onCancelRequest();
            }

            return [{}, cmd.ofMsg(Msg.execCancel())];

        case "ExecCancel":
            props.onCancel();

            return [{}];
    }
};

const validate = <T, TModel extends Model>(model: TModel, options: UpdateOptions<T, TModel>): IValidationError [] => {
    if (options.validators) {
        const errors = runValidation(...options.validators)

        return errors;
    }
    if (options.validate) {
        const errors = options.validate(model);

        return errors;
    }

    return [];
};