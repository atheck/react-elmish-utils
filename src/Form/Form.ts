import { cmd, type MsgSource, type UpdateReturnType } from "react-elmish";
import { getError, type ValidationError, type ValidationKey } from "../Validation";

type MessageSource = MsgSource<"Form">;

type Message<TValues, TValidationKeys extends ValidationKey = keyof TValues> = (
	| { name: "ValueChanged"; value: Partial<TValues> }
	| { name: "AcceptRequest" }
	| { name: "Accept" }
	| { name: "CancelRequest" }
	| { name: "Cancel" }
	| { name: "Validate"; msg?: Message<TValues, TValidationKeys> }
	| { name: "Validated"; errors: ValidationError<TValidationKeys>[]; msg?: Message<TValues, TValidationKeys> }
	| { name: "ReValidate" }
) &
	MessageSource;

const Source: MessageSource = { source: "Form" };

interface Model<TValues, TValidationKeys extends ValidationKey = keyof TValues> {
	values: TValues;
	errors: ValidationError<TValidationKeys>[];
	validated: boolean;
}

interface Options<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues> {
	/**
	 * Is called to create the initial form values.
	 * @returns The initial form values.
	 */
	initValues: (props: TProps) => TValues;
	/**
	 * Is called to validate all inputs of the Form.
	 * @returns An array of validation errors, or an empty array if all inputs are valid.
	 */
	validate?: (
		model: Model<TValues, TValidationKeys> & TModel & { reValidating: boolean },
		props: TProps,
	) => Promise<ValidationError<TValidationKeys>[]>;
	/**
	 * This callback is called when one ore more values were changed.
	 * @remarks
	 * In this function you can manipulate the values of the form.
	 */
	onValueChanged?: (values: Partial<TValues>, model: Model<TValues, TValidationKeys> & TModel, props: TProps) => Partial<TValues>;
	/**
	 * This callback is called after the validation.
	 */
	onValidated?: (
		errors: ValidationError<TValidationKeys>[],
		model: Model<TValues, TValidationKeys> & TModel & { reValidating: boolean },
		props: TProps,
	) => void;
	/**
	 * This callback is called when the form should be cancelled.
	 * @param model The current model.
	 * @param props The props.
	 */
	onCancel?: (model: Model<TValues, TValidationKeys> & TModel, props: TProps) => void;
	/**
	 * This callback is called when the form should be accepted.
	 * @param model The current model.
	 * @param props The props.
	 */
	onAccept?: (model: Model<TValues, TValidationKeys> & TModel, props: TProps) => void;
}

interface Msg<TValues, TValidationKeys extends ValidationKey = keyof TValues> {
	/**
	 * Updates the modified value.
	 */
	valueChanged: (value: Partial<TValues>) => Message<TValues, TValidationKeys>;
	/**
	 * Requests to accept the Form.
	 */
	acceptRequest: () => Message<TValues, TValidationKeys>;
	/**
	 * Accepts the Form.
	 */
	accept: () => Message<TValues, TValidationKeys>;
	/**
	 * Requests to cancel the Form.
	 */
	cancelRequest: () => Message<TValues, TValidationKeys>;
	/**
	 * Cancels the Form.
	 */
	cancel: () => Message<TValues, TValidationKeys>;
	/**
	 * Validates all inputs.
	 */
	validate: (msg?: Message<TValues, TValidationKeys>) => Message<TValues, TValidationKeys>;
	/**
	 * All inputs validated.
	 */
	validated: (
		errors: ValidationError<TValidationKeys>[],
		msg?: Message<TValues, TValidationKeys>,
	) => Message<TValues, TValidationKeys>;
	/**
	 * Runs the validation again if it has already been performed.
	 */
	reValidate: () => Message<TValues, TValidationKeys>;
}

interface Form<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues> {
	/**
	 * Initializes the Form model.
	 */
	init: (props: TProps) => Model<TValues, TValidationKeys>;

	/**
	 * Updates the Form model.
	 */
	update: (
		model: Model<TValues, TValidationKeys> & TModel,
		msg: Message<TValues, TValidationKeys>,
		props: TProps,
	) => UpdateReturnType<Model<TValues, TValidationKeys>, Message<TValues, TValidationKeys>>;

	/**
	 * Object to call Form messages.
	 */
	// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
	Msg: Msg<TValues, TValidationKeys>;

	/**
	 * Gets a validation error for a key.
	 * @param key The key of the error to get.
	 * @param errors The list of errors.
	 * @returns The error for the given key, or null if there is no error.
	 */
	getError: (key: TValidationKeys, errors: ValidationError<TValidationKeys>[]) => string | null;
}

/**
 * Creates a Form object.
 * @param options Options to pass to the Form.
 * @returns The created Form object.
 */
function createForm<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues>(
	options: Options<TModel, TProps, TValues, TValidationKeys>,
): Form<TModel, TProps, TValues, TValidationKeys> {
	let reValidating = false;
	const validate = async (
		model: Model<TValues, TValidationKeys> & TModel,
		props: TProps,
	): Promise<ValidationError<TValidationKeys>[]> => {
		if (options.validate) {
			return options.validate({ ...model, reValidating }, props);
		}

		return [];
	};

	const Msg = {
		valueChanged: (value: Partial<TValues>): Message<TValues, TValidationKeys> => ({ name: "ValueChanged", value, ...Source }),
		acceptRequest: (): Message<TValues, TValidationKeys> => ({ name: "AcceptRequest", ...Source }),
		accept: (): Message<TValues, TValidationKeys> => ({ name: "Accept", ...Source }),
		cancelRequest: (): Message<TValues, TValidationKeys> => ({ name: "CancelRequest", ...Source }),
		cancel: (): Message<TValues, TValidationKeys> => ({ name: "Cancel", ...Source }),
		validate: (msg?: Message<TValues, TValidationKeys>): Message<TValues, TValidationKeys> => ({
			name: "Validate",
			msg,
			...Source,
		}),
		validated: (
			errors: ValidationError<TValidationKeys>[],
			msg?: Message<TValues, TValidationKeys>,
		): Message<TValues, TValidationKeys> => ({ name: "Validated", errors, msg, ...Source }),
		reValidate: (): Message<TValues, TValidationKeys> => ({ name: "ReValidate", ...Source }),
	};

	return {
		// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
		Msg,
		init(props: TProps): Model<TValues, TValidationKeys> {
			return {
				errors: [],
				validated: false,
				values: options.initValues(props),
			};
		},

		update(
			model: Model<TValues, TValidationKeys> & TModel,
			msg: Message<TValues, TValidationKeys>,
			props: TProps,
		): UpdateReturnType<Model<TValues, TValidationKeys>, Message<TValues, TValidationKeys>> {
			switch (msg.name) {
				case "ValueChanged": {
					const value = options.onValueChanged ? options.onValueChanged(msg.value, model, props) : msg.value;

					return [
						{
							values: { ...model.values, ...value },
						},
						cmd.ofMsg(Msg.reValidate()),
					];
				}

				case "AcceptRequest":
					return [{}, cmd.ofMsg(Msg.validate(Msg.accept()))];

				case "Accept": {
					options.onAccept?.(model, props);

					return [{}];
				}

				case "CancelRequest":
					return [{}, cmd.ofMsg(Msg.cancel())];

				case "Cancel": {
					options.onCancel?.(model, props);

					return [{}];
				}

				case "Validate":
					return [
						{ errors: [], validated: true },
						cmd.ofSuccess(validate, (errors) => Msg.validated(errors, msg.msg), model, props),
					];

				case "Validated": {
					options.onValidated?.(msg.errors, { ...model, reValidating }, props);
					reValidating = false;

					if (msg.errors.length > 0) {
						return [{ errors: msg.errors }];
					}

					if (msg.msg) {
						return [{}, cmd.ofMsg(msg.msg)];
					}

					return [{}];
				}

				case "ReValidate": {
					if (model.validated) {
						reValidating = true;

						return [{}, cmd.ofMsg(Msg.validate())];
					}

					return [{}];
				}
			}
		},

		getError(key: TValidationKeys, errors: ValidationError<TValidationKeys>[]) {
			return getError<TValidationKeys>(key, errors);
		},
	};
}

export type { Form, Message, Model, Options };

export { createForm };
