interface ValidationError {
    key: string,
    message: string,
}

type Validator = [string, ValidatorFunc];
type ValidatorFunc = () => string | null | Promise<string | null>;

function getError (key: string, errors: ValidationError []): string | null {
    return errors.find(error => error.key === key)?.message ?? null;
}

async function runValidation (...validators: Validator []): Promise<ValidationError []> {
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

export type {
    ValidationError,
    Validator,
    ValidatorFunc,
};

export {
    getError,
    runValidation,
};