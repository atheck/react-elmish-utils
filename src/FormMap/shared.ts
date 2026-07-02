import type { Options } from "../Form/shared";
import type { ValidationError, ValidationKey } from "../Validation";

type Message<TValues, TValidationKeys extends ValidationKey = keyof TValues> =
	| { name: "valueChanged"; value: Partial<TValues> }
	| { name: "acceptRequest" }
	| { name: "accept" }
	| { name: "cancelRequest" }
	| { name: "cancel" }
	| { name: "validate"; msg?: Message<TValues, TValidationKeys> }
	| { name: "validated"; errors: ValidationError<TValidationKeys>[]; msg?: Message<TValues, TValidationKeys> }
	| { name: "reValidate" };

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

interface FormMapOptions<TModel, TProps, TValues, TValidationKeys extends ValidationKey = keyof TValues>
	extends Options<TModel, TProps, TValues, TValidationKeys> {
	/**
	 * If true, all string values will be trimmed before they are validated and accepted.
	 */
	trimValues?: boolean;
}

/**
 * Creates the `Msg` object with the FormMap message creators.
 * @returns The `Msg` object.
 */
function createMsg<TValues, TValidationKeys extends ValidationKey = keyof TValues>(): Msg<TValues, TValidationKeys> {
	return {
		valueChanged: (value: Partial<TValues>): Message<TValues, TValidationKeys> => ({ name: "valueChanged", value }),
		acceptRequest: (): Message<TValues, TValidationKeys> => ({ name: "acceptRequest" }),
		accept: (): Message<TValues, TValidationKeys> => ({ name: "accept" }),
		cancelRequest: (): Message<TValues, TValidationKeys> => ({ name: "cancelRequest" }),
		cancel: (): Message<TValues, TValidationKeys> => ({ name: "cancel" }),
		validate: (msg?: Message<TValues, TValidationKeys>): Message<TValues, TValidationKeys> => ({ name: "validate", msg }),
		validated: (
			errors: ValidationError<TValidationKeys>[],
			msg?: Message<TValues, TValidationKeys>,
		): Message<TValues, TValidationKeys> => ({
			name: "validated",
			errors,
			msg,
		}),
		reValidate: (): Message<TValues, TValidationKeys> => ({ name: "reValidate" }),
	};
}

/**
 * Trims all string values of the given object.
 * @param values The values to trim.
 * @returns The trimmed values.
 */
function trimValues<TValues>(values: TValues): TValues {
	if (typeof values !== "object" || values === null) {
		return values;
	}

	const mappedValues = values as Record<string, unknown>;

	return Object.fromEntries(
		Object.entries(mappedValues).map(([key, value]) => {
			if (typeof value === "string") {
				return [key, value.trim()];
			}

			return [key, value];
		}),
	) as TValues;
}

export type { FormMapOptions, Message, Msg };

export { createMsg, trimValues };
