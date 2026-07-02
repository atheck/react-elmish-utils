import type { Draft } from "immer";
import { cmd, type UpdateReturnType } from "react-elmish/immutable";
import { createInit, createMsg, type Message, type Model, type Msg as MsgObject, type Options } from "../Form/shared";
import { getError, type ValidationError, type ValidationKey } from "../Validation";
import { asWritable, snapshot } from "./draft";

interface Form<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues> {
	/**
	 * Initializes the Form model.
	 */
	init: (props: TProps) => Model<TValues, TValidationKeys>;

	/**
	 * Updates the Form model.
	 */
	update: (
		model: Draft<Model<TValues, TValidationKeys> & TModel>,
		msg: Message<TValues, TValidationKeys>,
		props: TProps,
	) => UpdateReturnType<Message<TValues, TValidationKeys>>;

	/**
	 * Object to call Form messages.
	 */
	// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
	Msg: MsgObject<TValues, TValidationKeys>;

	/**
	 * Gets a validation error for a key.
	 * @param key The key of the error to get.
	 * @param errors The list of errors.
	 * @returns The error for the given key, or null if there is no error.
	 */
	getError: (key: TValidationKeys, errors: ValidationError<TValidationKeys>[]) => string | null;
}

/**
 * Creates a Form object for the immutable react-elmish API.
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
			return await options.validate({ ...model, reValidating }, props);
		}

		return [];
	};

	const Msg = createMsg<TValues, TValidationKeys>();

	return {
		// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
		Msg,
		init: createInit(options),

		update(
			draft: Draft<Model<TValues, TValidationKeys> & TModel>,
			msg: Message<TValues, TValidationKeys>,
			props: TProps,
		): UpdateReturnType<Message<TValues, TValidationKeys>> {
			const model = asWritable(draft);

			switch (msg.name) {
				case "ValueChanged": {
					const value = options.onValueChanged ? options.onValueChanged(msg.value, snapshot(draft), props) : msg.value;

					Object.assign(model.values as Record<string, unknown>, value);

					return [cmd.ofMsg(Msg.reValidate())];
				}

				case "AcceptRequest":
					return [cmd.ofMsg(Msg.validate(Msg.accept()))];

				case "Accept": {
					options.onAccept?.(snapshot(draft), props);

					return [];
				}

				case "CancelRequest":
					return [cmd.ofMsg(Msg.cancel())];

				case "Cancel": {
					options.onCancel?.(snapshot(draft), props);

					return [];
				}

				case "Validate": {
					const state = snapshot(draft);

					model.errors = [];
					model.validated = true;

					return [cmd.ofSuccess(validate, (errors) => Msg.validated(errors, msg.msg), state, props)];
				}

				case "Validated": {
					options.onValidated?.(msg.errors, { ...snapshot(draft), reValidating }, props);
					reValidating = false;

					if (msg.errors.length > 0) {
						model.errors = msg.errors;
					}

					if (msg.msg && msg.errors.length === 0) {
						return [cmd.ofMsg(msg.msg)];
					}

					return [];
				}

				case "ReValidate": {
					if (model.validated) {
						reValidating = true;

						return [cmd.ofMsg(Msg.validate())];
					}

					return [];
				}
			}
		},

		getError(key: TValidationKeys, errors: ValidationError<TValidationKeys>[]) {
			return getError<TValidationKeys>(key, errors);
		},
	};
}

export type { Form };

export { createForm };
