import { cmd, MsgSource, UpdateReturnType } from "react-elmish";
import { getError, ValidationError } from "../Validation";

type MessageSource = MsgSource<"Form">;

type Message<TValues, TValidationKeys = string> = (
    | { name: "ValueChanged", value: Partial<TValues> }
    | { name: "AcceptRequest" }
    | { name: "Accept" }
    | { name: "CancelRequest" }
    | { name: "Cancel" }
    | { name: "Validate", msg?: Message<TValues, TValidationKeys> }
    | { name: "Validated", errors: ValidationError<TValidationKeys> [], msg?: Message<TValues, TValidationKeys> }
    | { name: "ReValidate" }
) & MessageSource;

const Source: MessageSource = { source: "Form" };

interface Model<TValues, TValidationKeys = string> {
    values: TValues,
    errors: ValidationError<TValidationKeys> [],
    validated: boolean,
}

interface Options<TModel, TProps, TValues, TValidationKeys = string> {
    /**
     * Is called to create the initial form values.
     * @returns {TValues} The initial form values.
     */
    initValues: (props: TProps) => TValues,
    /**
     * Is called to validate all inputs of the Form.
     * @returns {IValidationError []} An array of validation errors, or an empty array if all inputs are valid.
     */
    validate?: (model: TModel, props: TProps) => Promise<ValidationError<TValidationKeys> []>,
    onValueChanged?: (values: Partial<TValues>, model: TModel, props: TProps) => Partial<TValues>,
    onCancel?: (model: TModel, props: TProps) => void,
    onAccept?: (model: TModel, props: TProps) => void,
}

interface Msg<TValues, TValidationKeys = string> {
    /**
     * Updates the modified value.
     */
    valueChanged: (value: Partial<TValues>) => Message<TValues, TValidationKeys>,
    /**
     * Requests to accept the Form.
     */
    acceptRequest: () => Message<TValues, TValidationKeys>,
    /**
     * Accepts the Form.
     */
    accept: () => Message<TValues, TValidationKeys>,
    /**
     * Requests to cancel the Form.
     */
    cancelRequest: () => Message<TValues, TValidationKeys>,
    /**
     * Cancels the Form.
     */
    cancel: () => Message<TValues, TValidationKeys>,
    /**
     * Validates all inputs.
     */
    validate: (msg?: Message<TValues, TValidationKeys>) => Message<TValues, TValidationKeys>,
    /**
     * All inputs validated.
     */
    validated: (errors: ValidationError<TValidationKeys> [], msg?: Message<TValues, TValidationKeys>) => Message<TValues, TValidationKeys>,
    /**
     * Runs the validation again if it has already been performed.
     */
    reValidate: () => Message<TValues, TValidationKeys>,
}

interface Form<TModel, TProps, TValues, TValidationKeys = string> {
    /**
     * Initializes the Form model.
     */
    init: (props: TProps) => Model<TValues, TValidationKeys>,
    /**
     * Updates the Form model.
     */
    update: (model: Model<TValues, TValidationKeys> & TModel, msg: Message<TValues, TValidationKeys>, props: TProps) => UpdateReturnType<Model<TValues, TValidationKeys>, Message<TValues, TValidationKeys>>,
    /**
     * Object to call Form messages.
     */
    Msg: Msg<TValues, TValidationKeys>,
    /**
     * Gets a validation error for a key.
     * @param key The key of the error to get.
     * @param errors The list of errors.
     * @returns The error for the given key, or null if there is no error.
     */
    getError: (key: TValidationKeys, errors: ValidationError<TValidationKeys> []) => string | null,
}

/**
 * Creates a Form object.
 * @param options Options to pass to the Form.
 * @returns The created Form object.
 */
function createForm<TModel, TProps, TValues, TValidationKeys = string> (options: Options<TModel, TProps, TValues, TValidationKeys>): Form<TModel, TProps, TValues, TValidationKeys> {
    const validate = async (model: Model<TValues, TValidationKeys> & TModel, props: TProps): Promise<ValidationError<TValidationKeys> []> => {
        if (options.validate) {
            return options.validate(model, props);
        }

        return [];
    };

    const Msg = {
        valueChanged: (value: Partial<TValues>): Message<TValues, TValidationKeys> => ({ name: "ValueChanged", value, ...Source }),
        acceptRequest: (): Message<TValues, TValidationKeys> => ({ name: "AcceptRequest", ...Source }),
        accept: (): Message<TValues, TValidationKeys> => ({ name: "Accept", ...Source }),
        cancelRequest: (): Message<TValues, TValidationKeys> => ({ name: "CancelRequest", ...Source }),
        cancel: (): Message<TValues, TValidationKeys> => ({ name: "Cancel", ...Source }),
        validate: (msg?: Message<TValues, TValidationKeys>): Message<TValues, TValidationKeys> => ({ name: "Validate", msg, ...Source }),
        validated: (errors: ValidationError<TValidationKeys> [], msg?: Message<TValues, TValidationKeys>): Message<TValues, TValidationKeys> => ({ name: "Validated", errors, msg, ...Source }),
        reValidate: (): Message<TValues, TValidationKeys> => ({ name: "ReValidate", ...Source }),
    };

    return {
        Msg,
        init (props: TProps): Model<TValues, TValidationKeys> {
            return {
                errors: [],
                validated: false,
                values: options.initValues(props),
            };
        },

        update (model: Model<TValues, TValidationKeys> & TModel, msg: Message<TValues, TValidationKeys>, props: TProps): UpdateReturnType<Model<TValues, TValidationKeys>, Message<TValues, TValidationKeys>> {
            switch (msg.name) {
                case "ValueChanged": {
                    const value = options.onValueChanged ? options.onValueChanged(msg.value, model, props) : msg.value;

                    return [
                        {
                            values: {
                                ...model.values,
                                ...value,
                            },
                        },
                        cmd.ofMsg(Msg.reValidate()),
                    ];
                }

                case "AcceptRequest":
                    return [{}, cmd.ofMsg(Msg.validate(Msg.accept()))];

                case "Accept":
                    options.onAccept?.(model, props);

                    return [{}];

                case "CancelRequest":
                    return [{}, cmd.ofMsg(Msg.cancel())];

                case "Cancel":
                    options.onCancel?.(model, props);

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
        getError (key: TValidationKeys, errors: ValidationError<TValidationKeys> []) {
            return getError<TValidationKeys>(key, errors);
        },
    };
}

export type {
    Message,
    Model,
    Options,
    Form,
};

export {
    createForm,
};