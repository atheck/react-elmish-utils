export interface IValidationError {
    key: string,
    message: string,
}

export type Validator = [string, ValidatorFunc];
export type ValidatorFunc = () => string | null;

export const getError = (key: string, errors: IValidationError []): string | null => {
    return errors.find(e => e.key === key)?.message ?? null;
};

export const runValidation = (...validators: Validator []): IValidationError [] => {
    const errors = validators
        .map(validator => ({ key: validator[0], message: validator[1]() }))
        .filter(({ message }) => message) as IValidationError [];

    return errors;
};