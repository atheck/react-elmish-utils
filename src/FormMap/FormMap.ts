import { cmd, UpdateMap } from "react-elmish";
import { Model, Options } from "../Form";
import { getError, ValidationError } from "../Validation";

type Message<TValues> =
    | { name: "valueChanged", value: Partial<TValues> }
    | { name: "acceptRequest" }
    | { name: "accept" }
    | { name: "cancelRequest" }
    | { name: "cancel" }
    | { name: "validate", msg?: Message<TValues> }
    | { name: "validated", errors: ValidationError [], msg?: Message<TValues> }
    | { name: "reValidate" };

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

interface FormMap<TModel, TProps, TValues, TValidationKeys> {
    /**
     * Initializes the Form model.
     */
    init: (props: TProps) => Model<TValues>,
    /**
     * Update map for the Form.
     */
    updateMap: UpdateMap<TProps, Model<TValues> & TModel, Message<TValues>>,
    /**
     * Object to call Form messages.
     */
    Msg: Msg<TValues>,
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
function createFormMap<TModel, TProps, TValues, TValidationKeys = keyof TValues> (options: Options<TModel, TProps, TValues, TValidationKeys>): FormMap<TModel, TProps, TValues, TValidationKeys> {
    const validate = async (model: Model<TValues> & TModel, props: TProps): Promise<ValidationError []> => {
        if (options.validate) {
            return options.validate(model, props);
        }

        return [];
    };

    const Msg = {
        valueChanged: (value: Partial<TValues>): Message<TValues> => ({ name: "valueChanged", value }),
        acceptRequest: (): Message<TValues> => ({ name: "acceptRequest" }),
        accept: (): Message<TValues> => ({ name: "accept" }),
        cancelRequest: (): Message<TValues> => ({ name: "cancelRequest" }),
        cancel: (): Message<TValues> => ({ name: "cancel" }),
        validate: (msg?: Message<TValues>): Message<TValues> => ({ name: "validate", msg }),
        validated: (errors: ValidationError [], msg?: Message<TValues>): Message<TValues> => ({ name: "validated", errors, msg }),
        reValidate: (): Message<TValues> => ({ name: "reValidate" }),
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

        updateMap: {
            valueChanged ({ value }, model, props) {
                const updatedValue = options.onValueChanged ? options.onValueChanged(value, model, props) : value;

                return [
                    {
                        values: {
                            ...model.values,
                            ...updatedValue,
                        },
                    } as Partial<Model<TValues> & TModel>,
                    cmd.ofMsg(Msg.reValidate()),
                ];
            },

            acceptRequest () {
                return [{}, cmd.ofMsg(Msg.validate(Msg.accept()))];
            },

            accept (_msg, model, props) {
                options.onAccept?.(model, props);

                return [{}];
            },

            cancelRequest () {
                return [{}, cmd.ofMsg(Msg.cancel())];
            },

            cancel (_msg, model, props) {
                options.onCancel?.(model, props);

                return [{}];
            },

            validate ({ msg }, model, props) {
                const noErrors: ValidationError [] = [];

                return [
                    {
                        errors: noErrors,
                        validated: true,
                    } as Partial<Model<TValues> & TModel>,
                    cmd.ofPromise.perform(validate, errors => Msg.validated(errors, msg), model, props),
                ];
            },

            validated ({ errors, msg }) {
                if (errors.length > 0) {
                    return [{ errors } as Partial<Model<TValues> & TModel>];
                }

                if (msg) {
                    return [{}, cmd.ofMsg(msg)];
                }

                return [{}];
            },

            reValidate (_msg, { validated }) {
                if (validated) {
                    return [{}, cmd.ofMsg(Msg.validate())];
                }

                return [{}];
            },
        },
        getError (key: TValidationKeys, errors: ValidationError<TValidationKeys> []) {
            return getError<TValidationKeys>(key, errors);
        },
    };
}

export type {
    Message,
    FormMap,
};

export {
    createFormMap,
};