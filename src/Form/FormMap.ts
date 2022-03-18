import { createCmd, MsgSource, UpdateMap } from "react-elmish";
import { Message, Model, Msg, Options } from "./Form";
import { ValidationError } from "../Validation";

type MessageSource = MsgSource<"Form">;

const Source: MessageSource = { source: "Form" };

export interface FormMap<TModel, TProps, TValues> {
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
export const createFormMap = <TModel, TProps, TValues>(options: Options<TModel, TProps, TValues>): FormMap<TModel, TProps, TValues> => {
    const cmd = createCmd<Message<TValues>>();

    const validate = async (model: Model<TValues> & TModel, props: TProps): Promise<ValidationError []> => {
        if (options.validate) {
            return options.validate(model, props);
        }

        return [];
    };

    const MsgActions = {
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
        Msg: MsgActions,
        init (props: TProps): Model<TValues> {
            return {
                errors: [],
                validated: false,
                values: options.initValues(props),
            };
        },

        updateMap: {
            ValueChanged ({ value }, model, props) {
                const updatedValue = options.onValueChanged ? options.onValueChanged(value, model, props) : value;

                return [
                    {
                        values: {
                            ...model.values,
                            ...updatedValue,
                        },
                    } as Partial<Model<TValues> & TModel>,
                    cmd.ofMsg(MsgActions.reValidate()),
                ];
            },

            AcceptRequest () {
                return [{}, cmd.ofMsg(MsgActions.validate(MsgActions.accept()))];
            },

            Accept (_msg, model, props) {
                options.onAccept?.(model, props);

                return [{}];
            },

            CancelRequest () {
                return [{}, cmd.ofMsg(MsgActions.cancel())];
            },

            Cancel (_msg, model, props) {
                options.onCancel?.(model, props);

                return [{}];
            },

            Validate ({ msg }, model, props) {
                const noErrors: ValidationError [] = [];

                return [
                    {
                        errors: noErrors,
                        validated: true,
                    } as Partial<Model<TValues> & TModel>,
                    cmd.ofPromise.perform(validate, errors => MsgActions.validated(errors, msg), model, props),
                ];
            },

            Validated ({ errors, msg }) {
                if (errors.length > 0) {
                    return [{ errors } as Partial<Model<TValues> & TModel>];
                }

                if (msg) {
                    return [{}, cmd.ofMsg(msg)];
                }

                return [{}];
            },

            ReValidate (_msg, { validated }) {
                if (validated) {
                    return [{}, cmd.ofMsg(MsgActions.validate())];
                }

                return [{}];
            },
        },
    };
};