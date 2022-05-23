import { createCmd, UpdateMap } from "react-elmish";
import { Model, Options } from "../Form";
import { ValidationError } from "../Validation";

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

interface FormMap<TModel, TProps, TValues> {
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
}

/**
 * Creates a Form object.
 * @param options Options to pass to the Form.
 * @returns The created Form object.
 */
function createFormMap<TModel, TProps, TValues> (options: Options<TModel, TProps, TValues>): FormMap<TModel, TProps, TValues> {
    const cmd = createCmd<Message<TValues>>();

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
    };
}

export type {
    Message,
    FormMap,
};

export {
    createFormMap,
};