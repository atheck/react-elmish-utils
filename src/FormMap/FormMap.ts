import { cmd, UpdateMap } from "react-elmish";
import { Model, Options } from "../Form";
import { getError, ValidationError, ValidationKey } from "../Validation";

type Message<TValues, TValidationKeys extends ValidationKey = keyof TValues> =
    | { name: "valueChanged", value: Partial<TValues> }
    | { name: "acceptRequest" }
    | { name: "accept" }
    | { name: "cancelRequest" }
    | { name: "cancel" }
    | { name: "validate", msg?: Message<TValues, TValidationKeys> }
    | { name: "validated", errors: ValidationError<TValidationKeys> [], msg?: Message<TValues, TValidationKeys> }
    | { name: "reValidate" };

interface Msg<TValues, TValidationKeys extends ValidationKey = keyof TValues> {
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

interface FormMap<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues> {
    /**
     * Initializes the Form model.
     */
    init: (props: TProps) => Model<TValues, TValidationKeys>,

    /**
     * Update map for the Form.
     */
    updateMap: UpdateMap<TProps, Model<TValues, TValidationKeys> & TModel, Message<TValues, TValidationKeys>>,

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
function createFormMap<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues> (options: Options<TModel, TProps, TValues, TValidationKeys>): FormMap<TModel, TProps, TValues, TValidationKeys> {
    const validate = async (model: Model<TValues, TValidationKeys> & TModel, props: TProps): Promise<ValidationError<TValidationKeys> []> => {
        if (options.validate) {
            return options.validate(model, props);
        }

        return [];
    };

    const Msg = {
        valueChanged: (value: Partial<TValues>): Message<TValues, TValidationKeys> => ({ name: "valueChanged", value }),
        acceptRequest: (): Message<TValues, TValidationKeys> => ({ name: "acceptRequest" }),
        accept: (): Message<TValues, TValidationKeys> => ({ name: "accept" }),
        cancelRequest: (): Message<TValues, TValidationKeys> => ({ name: "cancelRequest" }),
        cancel: (): Message<TValues, TValidationKeys> => ({ name: "cancel" }),
        validate: (msg?: Message<TValues, TValidationKeys>): Message<TValues, TValidationKeys> => ({ name: "validate", msg }),
        validated: (errors: ValidationError<TValidationKeys> [], msg?: Message<TValues, TValidationKeys>): Message<TValues, TValidationKeys> => ({ name: "validated", errors, msg }),
        reValidate: (): Message<TValues, TValidationKeys> => ({ name: "reValidate" }),
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

        updateMap: {
            valueChanged ({ value }, model, props) {
                const updatedValue = options.onValueChanged ? options.onValueChanged(value, model, props) : value;

                return [
                    {
                        values: {
                            ...model.values,
                            ...updatedValue,
                        },
                    } as Partial<Model<TValues, TValidationKeys> & TModel>,
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
                const noErrors: ValidationError<TValidationKeys> [] = [];

                return [
                    {
                        errors: noErrors,
                        validated: true,
                    } as Partial<Model<TValues, TValidationKeys> & TModel>,
                    cmd.ofPromise.perform(validate, errors => Msg.validated(errors, msg), model, props),
                ];
            },

            validated ({ errors, msg }) {
                if (errors.length > 0) {
                    return [{ errors } as Partial<Model<TValues, TValidationKeys> & TModel>];
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