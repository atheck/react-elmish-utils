import { createForm, Form, Message as FormMessage, Model as FormModel, Options as FormOptions } from "./Form";
import { createFormMap, FormMap, Message as FormMapMessage } from "./FormMap/FormMap";
import { getError, runValidation, ValidationError, Validator, ValidatorFunc } from "./Validation";

export type { Form, FormMap, FormOptions, FormMessage, FormMapMessage, FormModel, ValidationError, Validator, ValidatorFunc };

export {
    createForm,
    createFormMap,
    getError,
    runValidation,
};