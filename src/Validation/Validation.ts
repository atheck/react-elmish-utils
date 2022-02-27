/**
 * @deprecated Use ValidationError instead.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IValidationError {
    key: string,
    message: string,
}
// eslint-disable-next-line @delagen/deprecation/deprecation
export interface ValidationError extends IValidationError {}

export type Validator = [string, ValidatorFunc];
export type ValidatorFunc = () => string | null | Promise<string | null>;

// eslint-disable-next-line @delagen/deprecation/deprecation
export function getError (key: string, errors: IValidationError []): string | null {
    return errors.find(error => error.key === key)?.message ?? null;
}

export async function runValidation (...validators: Validator []): Promise<ValidationError []> {
    const errors: ValidationError [] = [];

    for (const [key, validatorFunc] of validators) {
        // eslint-disable-next-line no-await-in-loop
        const message = await validatorFunc();

        if (message) {
            errors.push({ key, message });
        }
    }

    return errors;
}