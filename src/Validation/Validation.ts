export interface IValidationError {
    key: string,
    message: string,
}

export type Validator = [string, ValidatorFunc];
export type ValidatorFunc = () => Nullable<string> | Promise<Nullable<string>>;

export const getError = (key: string, errors: IValidationError []): Nullable<string> => {
    return errors.find(e => e.key === key)?.message ?? null;
};

export const runValidation = async (...validators: Validator []): Promise<IValidationError []> => {
    const errors: IValidationError [] = [];

    for (const validator of validators) {
        const message = await validator[1]();

        if (message) {
            errors.push({ key: validator[0], message });
        }
    }

    return errors;
};