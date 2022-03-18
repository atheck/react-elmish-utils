import { createForm, Form, Message as FormMessage, Model as FormModel, Options as FormOptions } from "./Form";
import { createFormMap, FormMap } from "./Form/FormMap";
import { getError, runValidation, ValidationError, Validator, ValidatorFunc } from "./Validation";

export type { Form, FormMap, FormOptions, FormMessage, FormModel, ValidationError, Validator, ValidatorFunc };

export {
    createForm,
    createFormMap,
    getError,
    runValidation,
};