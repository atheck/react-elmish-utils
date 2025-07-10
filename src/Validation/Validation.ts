type ValidationKey = string | symbol | number;

interface ValidationError<TValidationKeys extends ValidationKey = string> {
	key: TValidationKeys;
	message: string;
}

type Validator<TValidationKeys extends ValidationKey = string> = [TValidationKeys, ValidatorFunc];
type ValidatorFunc = () => string | null | Promise<string | null>;

/**
 * Gets a validation error for a key.
 * @param key The key of the error to get.
 * @param errors The list of errors.
 * @returns The error for the given key, or null if there is no error.
 */
function getError<TValidationKeys extends ValidationKey = string>(
	key: TValidationKeys,
	errors: ValidationError<TValidationKeys>[],
): string | null {
	return errors.find((error) => error.key === key)?.message ?? null;
}

/**
 * Runs the validation using all provided validators.
 * @param validators The list of validators.
 * @returns A list of validation errors.
 */
async function runValidation<TValidationKeys extends ValidationKey = string>(
	...validators: Validator<TValidationKeys>[]
): Promise<ValidationError<TValidationKeys>[]> {
	const errors: ValidationError<TValidationKeys>[] = [];

	for (const [key, validatorFunc] of validators) {
		// biome-ignore lint/nursery/noAwaitInLoop: Maybe we should use Promise.all here in the future.
		const message = await validatorFunc();

		if (message) {
			errors.push({ key, message });
		}
	}

	return errors;
}

export type { ValidationError, ValidationKey, Validator, ValidatorFunc };

export { getError, runValidation };
