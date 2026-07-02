import { cmd, type UpdateMap } from "react-elmish/immutable";
import { createInit, type Model } from "../Form/shared";
import { createMsg, type FormMapOptions, type Message, type Msg as MsgObject, trimValues } from "../FormMap/shared";
import { getError, type ValidationError, type ValidationKey } from "../Validation";
import { asWritable, snapshot } from "./draft";

interface FormMap<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues> {
	/**
	 * Initializes the Form model.
	 */
	init: (props: TProps) => Model<TValues, TValidationKeys>;

	/**
	 * Update map for the Form.
	 */
	updateMap: UpdateMap<TProps, Model<TValues, TValidationKeys> & TModel, Message<TValues, TValidationKeys>>;

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
function createFormMap<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues>(
	options: FormMapOptions<TModel, TProps, TValues, TValidationKeys>,
): FormMap<TModel, TProps, TValues, TValidationKeys> {
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

		updateMap: {
			valueChanged({ value }, draft, props) {
				const model = asWritable(draft);
				const updatedValue = options.onValueChanged ? options.onValueChanged(value, snapshot(draft), props) : value;

				Object.assign(model.values as Record<string, unknown>, updatedValue);

				return [cmd.ofMsg(Msg.reValidate())];
			},

			acceptRequest() {
				return [cmd.ofMsg(Msg.validate(Msg.accept()))];
			},

			accept(_msg, draft, props) {
				const state = snapshot(draft);
				const trimmedValues = options.trimValues ? trimValues(state.values) : state.values;

				options.onAccept?.({ ...state, values: trimmedValues }, props);

				return [];
			},

			cancelRequest() {
				return [cmd.ofMsg(Msg.cancel())];
			},

			cancel(_msg, draft, props) {
				options.onCancel?.(snapshot(draft), props);

				return [];
			},

			validate({ msg }, draft, props) {
				const model = asWritable(draft);
				const state = snapshot(draft);
				const trimmedValues = options.trimValues ? trimValues(state.values) : state.values;

				model.errors = [];
				model.validated = true;

				return [cmd.ofSuccess(validate, (errors) => Msg.validated(errors, msg), { ...state, values: trimmedValues }, props)];
			},

			validated({ errors, msg }, draft, props) {
				const model = asWritable(draft);
				const state = snapshot(draft);
				const trimmedValues = options.trimValues ? trimValues(state.values) : state.values;

				options.onValidated?.(errors, { ...state, values: trimmedValues, reValidating }, props);
				reValidating = false;

				if (errors.length > 0) {
					model.errors = errors;

					return [];
				}

				if (msg) {
					return [cmd.ofMsg(msg)];
				}

				return [];
			},

			reValidate(_msg, model) {
				if (model.validated) {
					reValidating = true;

					return [cmd.ofMsg(Msg.validate())];
				}

				return [];
			},
		},

		getError(key: TValidationKeys, errors: ValidationError<TValidationKeys>[]) {
			return getError<TValidationKeys>(key, errors);
		},
	};
}

export type { FormMap };

export { createFormMap };
