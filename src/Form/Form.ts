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

export type Options<TModel, TProps, TData> = {
    /**
     * Is called to convert all Form inputs to the target type.
     * @returns {TData} The converted data.
     */
    getData: (model: TModel, props: TProps) => TData,
    /**
     * Is called to validate all inputs of the Form.
     * @returns {IValidationError []} An array of validation errors, or an empty array if all inputs are valid.
     */
    validate?: (model: TModel, props: TProps) => IValidationError [],
    /**
     * Is called when the user wants to cancel the Form.
     */
    onCancelRequest?: (model: TModel, props: TProps) => UpdateReturnType<TModel, Message>,
};

export type Props<TData> = Readonly<{
    /**
     * Is called when the Form is being accepted.
     */
    onAccept: (data: TData) => void,
    /**
     * Is called when the Form is being cancelled.
     */
    onCancel: () => void,
}>;

type Msg = {
    /**
     * Runs the validation again if it has already been performed.
     */
    reValidate: () => Message,
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
};

type Form<TModel, TProps, TData> = {
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
                        return options.onCancelRequest(model, props);
                    }

                    return [{}, cmd.ofMsg(Msg.cancel())];

                case "Cancel":
                    props.onCancel();

                    return [{}];
            }
        },
    };
};