import { createForm, Form, Message as FormMessage, Model as FormModel, Options as FormOptions } from "./Form";

export type { Form, FormOptions, FormMessage, FormModel };
export { createForm };

import { getError, IValidationError, runValidation, ValidationError, Validator, ValidatorFunc } from "./Validation";

// eslint-disable-next-line @delagen/deprecation/deprecation
export type { IValidationError, ValidationError, Validator, ValidatorFunc };
export { getError, runValidation };