interface ValidationError<TValidationKeys = string> {
    key: TValidationKeys,
    message: string,
}

type Validator<TValidationKeys = string> = [TValidationKeys, ValidatorFunc];
type ValidatorFunc = () => string | null | Promise<string | null>;

/**
 * Gets a validation error for a key.
 * @param key The key of the error to get.
 * @param errors The list of errors.
 * @returns The error for the given key, or null if there is no error.
 */
function getError<TValidationKeys = string> (key: TValidationKeys, errors: ValidationError<TValidationKeys> []): string | null {
    return errors.find(error => error.key === key)?.message ?? null;
}

async function runValidation<TValidationKeys = string> (...validators: Validator<TValidationKeys> []): Promise<ValidationError<TValidationKeys> []> {
    const errors: ValidationError<TValidationKeys> [] = [];

    for (const [key, validatorFunc] of validators) {
        // eslint-disable-next-line no-await-in-loop
        const message = await validatorFunc();

        if (message) {
            errors.push({ key, message });
        }
    }

    return errors;
}

export type {
    ValidationError,
    Validator,
    ValidatorFunc,
};

export {
    getError,
    runValidation,
};