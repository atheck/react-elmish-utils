import { createCmd, MsgSource, UpdateReturnType } from "react-elmish";
import { ValidationError } from "../Validation";

type MessageSource = MsgSource<"Form">;

export type Message =
    | { name: "AcceptRequest" } & MessageSource
    | { name: "Accept" } & MessageSource
    | { name: "CancelRequest" } & MessageSource
    | { name: "Cancel" } & MessageSource
    | { name: "Validate", msg?: Message } & MessageSource
    | { name: "Validated", errors: ValidationError [], msg?: Message } & MessageSource
    | { name: "ReValidate" } & MessageSource;

const Source: MessageSource = { source: "Form" };

export type Model = Readonly<{
    errors: ValidationError [],
    validated: boolean,
}>;

export interface Options<TModel, TProps, TData> {
    /**
     * Is called to convert all Form inputs to the target type.
     * @returns {TData} The converted data.
     */
    getData: (model: TModel, props: TProps) => TData,
    /**
     * Is called to validate all inputs of the Form.
     * @returns {IValidationError []} An array of validation errors, or an empty array if all inputs are valid.
     */
    validate?: (model: TModel, props: TProps) => Promise<ValidationError []>,
}

export interface Props<TData> {
    /**
     * Is called when the Form is being accepted.
     */
    readonly onAccept: (data: TData) => void,
    /**
     * Is called when the Form is being cancelled.
     */
    readonly onCancel: () => void,
}

interface Msg {
    /**
     * Requests to accept the Form.
     */
    acceptRequest: () => Message,
    /**
     * Accepts the Form.
     */
    accept: () => Message,
    /**
     * Requests to cancel the Form.
     */
    cancelRequest: () => Message,
    /**
     * Cancels the Form.
     */
    cancel: () => Message,
    /**
     * Validates all inputs.
     */
    validate: (msg?: Message) => Message,
    /**
     * All inputs validated.
     */
    validated: (errors: ValidationError [], msg?: Message) => Message,
    /**
     * Runs the validation again if it has already been performed.
     */
    reValidate: () => Message,
}

export interface Form<TModel, TProps, TData> {
    /**
     * Initializes the Form model.
     */
    init: () => Model,
    /**
     * Updates the Form model.
     */
    update: (model: Model & TModel, msg: Message, props: Props<TData> & TProps) => UpdateReturnType<Model, Message>,
    /**
     * Object to call Form messages.
     */
    Msg: Msg,
}

/**
 * Creates a Form object.
 * @param options Options to pass to the Form.
 * @returns The created Form object.
 */
export const createForm = <TModel, TProps, TData>(options: Options<TModel, TProps, TData>): Form<TModel, TProps, TData> => {
    const cmd = createCmd<Message>();

    const validate = async (model: Model & TModel, props: Props<TData> & TProps): Promise<ValidationError []> => {
        if (options.validate) {
            return options.validate(model, props);
        }

        return [];
    };

    const Msg = {
        acceptRequest: (): Message => ({ name: "AcceptRequest", ...Source }),
        accept: (): Message => ({ name: "Accept", ...Source }),
        cancelRequest: (): Message => ({ name: "CancelRequest", ...Source }),
        cancel: (): Message => ({ name: "Cancel", ...Source }),
        validate: (msg?: Message): Message => ({ name: "Validate", msg, ...Source }),
        validated: (errors: ValidationError [], msg?: Message): Message => ({ name: "Validated", errors, msg, ...Source }),
        reValidate: (): Message => ({ name: "ReValidate", ...Source }),
    };

    return {
        Msg,
        init (): Model {
            return {
                errors: [],
                validated: false,
            };
        },

        update (model: Model & TModel, msg: Message, props: Props<TData> & TProps): UpdateReturnType<Model, Message> {
            switch (msg.name) {
                case "AcceptRequest": {
                    return [{}, cmd.ofMsg(Msg.validate(Msg.accept()))];
                }

                case "Accept": {
                    props.onAccept(options.getData(model, props));

                    return [{}];
                }

                case "CancelRequest":
                    return [{}, cmd.ofMsg(Msg.cancel())];

                case "Cancel":
                    props.onCancel();

                    return [{}];

                case "Validate":
                    return [{ ...model, errors: [], validated: true }, cmd.ofPromise.perform(validate, errors => Msg.validated(errors, msg.msg), model, props)];

                case "Validated":
                    if (msg.errors.length > 0) {
                        return [{ ...model, errors: msg.errors }];
                    }

                    if (msg.msg) {
                        return [{}, cmd.ofMsg(msg.msg)];
                    }

                    return [{}];

                case "ReValidate":
                    if (model.validated) {
                        return [{}, cmd.ofMsg(Msg.validate())];
                    }

                    return [{}];
            }
        },
    };
};