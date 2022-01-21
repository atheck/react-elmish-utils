import { createCmd, MsgSource, UpdateReturnType } from "react-elmish";
import { ValidationError } from "../Validation";

type MessageSource = MsgSource<"Form">;

export type Message<TValues> = (
    | { name: "ValueChanged", value: Partial<TValues> }
    | { name: "AcceptRequest" }
    | { name: "Accept" }
    | { name: "CancelRequest" }
    | { name: "Cancel" }
    | { name: "Validate", msg?: Message<TValues> }
    | { name: "Validated", errors: ValidationError [], msg?: Message<TValues> }
    | { name: "ReValidate" }
) & MessageSource;

const Source: MessageSource = { source: "Form" };

export interface Model<TValues> {
    values: TValues,
    errors: ValidationError [],
    validated: boolean,
}

export interface Options<TModel, TProps, TValues> {
    /**
     * Is called to create the initial form values.
     * @returns {TValues} The initial form values.
     */
    initValues: (props: TProps) => TValues,
    /**
     * Is called to validate all inputs of the Form.
     * @returns {IValidationError []} An array of validation errors, or an empty array if all inputs are valid.
     */
    validate?: (model: TModel, props: TProps) => Promise<ValidationError []>,
}

interface Msg<TValues> {
    /**
     * Updates the modified value.
     */
    valueChanged: (value: Partial<TValues>) => Message<TValues>,
    /**
     * Requests to accept the Form.
     */
    acceptRequest: () => Message<TValues>,
    /**
     * Accepts the Form.
     */
    accept: () => Message<TValues>,
    /**
     * Requests to cancel the Form.
     */
    cancelRequest: () => Message<TValues>,
    /**
     * Cancels the Form.
     */
    cancel: () => Message<TValues>,
    /**
     * Validates all inputs.
     */
    validate: (msg?: Message<TValues>) => Message<TValues>,
    /**
     * All inputs validated.
     */
    validated: (errors: ValidationError [], msg?: Message<TValues>) => Message<TValues>,
    /**
     * Runs the validation again if it has already been performed.
     */
    reValidate: () => Message<TValues>,
}

export interface Form<TModel, TProps, TValues> {
    /**
     * Initializes the Form model.
     */
    init: (props: TProps) => Model<TValues>,
    /**
     * Updates the Form model.
     */
    update: (model: Model<TValues> & TModel, msg: Message<TValues>, props: TProps) => UpdateReturnType<Model<TValues>, Message<TValues>>,
    /**
     * Object to call Form messages.
     */
    Msg: Msg<TValues>,
}

/**
 * Creates a Form object.
 * @param options Options to pass to the Form.
 * @returns The created Form object.
 */
export const createForm = <TModel, TProps, TValues>(options: Options<TModel, TProps, TValues>): Form<TModel, TProps, TValues> => {
    const cmd = createCmd<Message<TValues>>();

    const validate = async (model: Model<TValues> & TModel, props: TProps): Promise<ValidationError []> => {
        if (options.validate) {
            return options.validate(model, props);
        }

        return Promise.resolve([]);
    };

    const Msg = {
        valueChanged: (value: Partial<TValues>): Message<TValues> => ({ name: "ValueChanged", value, ...Source }),
        acceptRequest: (): Message<TValues> => ({ name: "AcceptRequest", ...Source }),
        accept: (): Message<TValues> => ({ name: "Accept", ...Source }),
        cancelRequest: (): Message<TValues> => ({ name: "CancelRequest", ...Source }),
        cancel: (): Message<TValues> => ({ name: "Cancel", ...Source }),
        validate: (msg?: Message<TValues>): Message<TValues> => ({ name: "Validate", msg, ...Source }),
        validated: (errors: ValidationError [], msg?: Message<TValues>): Message<TValues> => ({ name: "Validated", errors, msg, ...Source }),
        reValidate: (): Message<TValues> => ({ name: "ReValidate", ...Source }),
    };

    return {
        Msg,
        init (props: TProps): Model<TValues> {
            return {
                errors: [],
                validated: false,
                values: options.initValues(props),
            };
        },

        update (model: Model<TValues> & TModel, msg: Message<TValues>, props: TProps): UpdateReturnType<Model<TValues>, Message<TValues>> {
            switch (msg.name) {
                case "ValueChanged":
                    return [
                        {
                            values: {
                                ...model.values,
                                ...msg.value,
                            },
                        },
                        cmd.ofMsg(Msg.reValidate()),
                    ];

                case "AcceptRequest": {
                    return [{}, cmd.ofMsg(Msg.validate(Msg.accept()))];
                }

                case "Accept": {
                    return [{}];
                }

                case "CancelRequest":
                    return [{}, cmd.ofMsg(Msg.cancel())];

                case "Cancel":
                    return [{}];

                case "Validate":
                    return [{ errors: [], validated: true }, cmd.ofPromise.perform(validate, errors => Msg.validated(errors, msg.msg), model, props)];

                case "Validated":
                    if (msg.errors.length > 0) {
                        return [{ errors: msg.errors }];
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