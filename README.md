# react-elmish-utils

![Build](https://github.com/atheck/react-elmish-utils/actions/workflows/main.yml/badge.svg)
![npm](https://img.shields.io/npm/v/react-elmish-utils)

Utility functions and types for [react-elmish](https://www.npmjs.com/package/react-elmish).

## Installation

`npm install react-elmish-utils`

## Usage

### Form

This module handles common tasks of a form.

If you want to use a Function Component and the `useElmishMap` hook, you can use the `FormMap`.

#### FormMap Example

~~~ts
import { createFormMap, FormMapMessage, FormModel } from "react-elmish-utils";
import { UpdateReturnType } from "react-elmish";

// The fields of the form
interface FormData {
    userName: string,
    password: string,
}

// Add Form model to our model
export interface Model extends FormModel<FormData> {}

export interface Props {
    initialUserName: string,
}

// Create the form object with options
const form = createFormMap({
    initValues (props: Props): FormData {
        // Here we set the initial form values
        return {
            userName: props.initialUserName,
            password: "",
        }
    }
    // You can provide a validate function which gets called by the form component, see [Validation](#validation) for further information.
});

// We need the Form messages only
export type Message =
    | FormMapMessage;

export const Msg = {
    ...form.Msg,
};

const cmd = createCmd<Message>();

export const init = (props: Props): [Model, Cmd<Message>] => {
    return [
        {
            // Initialize the Form model
            ...form.init(props),
        },
        cmd.none
    ];
};

// Add the Form update map to our update map
export const updateMap: UpdateMap<Props, Model, Message> = {
    ...form.updateMap,
};
~~~

In your UI component you can dispatch the `valueChanged` message to update one or more values:

~~~tsx
function Form (props: Props): JSX.Element {
    const [{ values }, dispatch] = useElmishMap(props, init, updateMap, "Form");
    const { userName, password } = values;

    return (
        <>
            <input value={userName} onChange={event => dispatch(Msg.valueChanged({ userName: event.target.value }))} />
            <input value={password} onChange={event => dispatch(Msg.valueChanged({ password: event.target.value }))} />
        </>
    );
}
~~~

To accept or cancel the form dispatch the `acceptRequest` and `cancelRequest` Form messages in the onClick event handlers of the buttons.

The `createFormMap` function takes an `Options` object:

| Property | Description |
| --- | --- |
| `initValues` | Function to set the initial form values. |
| `validate` | (optional) Function to validate the data when the user accepts the form. It returns an array of `IValidationError`s. See [Validation](#validation). The `validate` function is not called when `validators` is specified. |
| `onAccept` | (optional) Function which get called by the **accept** message. You can add code here to accept the form. |
| `onCancel` | (optional) Function which get called by the **cancel** message. You can add code here to cancel the form. |
| `onValueChange` | (optional) Function which get called by the **valueChanged** message. You can add code here to modify the changed values. |

#### Hook into or overwrite messages

To make the form work, you need to overwrite at least the **accept** and the **cancel** messages, or provide `onAccept` and `onCancel` to the form options.

By default **cancelRequest** only calls **cancel**. If you want to override this behavior, i.e. to show some confirmation to the user, also overwrite  this message.

~~~ts
export const updateMap: UpdateMap<Props, Model, Message> = {
    ...form.updateMap,
    cancelRequest: () => [{}, cmd.ofPromise.perform(showConfirmation, Msg.cancel)],
};
~~~

#### Form Example

For Class Components or with usage of the `useElmish` hook, you need to use the classic way of composition:

~~~ts
import * as Form from "react-elmish-utils/dist/Form";
import { UpdateReturnType } from "react-elmish";

// The fields of the form
interface FormData {
    userName: string,
    password: string,
}

// Add Form model to our model
export interface Model extends Form.Model<FormData> {}

export interface Props {
    initialUserName: string,
}

// Create the form object with options
const form = Form.createForm({
    initValues (props: Props): FormData {
        // Here we set the initial form values
        return {
            userName: props.initialUserName,
            password: "",
        }
    }
    // You can provide a validate function which gets called by the form component, see [Validation](#validation) for further information.
});

// We only need the Form messages
export type Message =
    | Form.Message;

export const Msg = {
    ...form.Msg,
};

const cmd = createCmd<Message>();

export const init = (props: Props): [Model, Cmd<Message>] => {
    return [
        {
            // Initialize the Form model
            ...form.init(props),
        },
        cmd.none
    ];
};

export const update = (model: Model, msg: Message, props: Props): UpdateReturnType<Model, Message> => {
    // Distinguish between our messages and Form messages (here we only have form messages)
    switch (msg.source) {
        case "Form":
            // We need to overwrite some form messages here
            switch (msg.name) {
                case "Accept":
                    // Add code here to accept the form
                    return [{}];

                case "Cancel":
                    // Add code here to cancel the form
                    return [{}];

                case "CancelRequest":
                    // You can add code here to handle a cancel request, i.e. to ask the user if he really wants to cancel.
                    // By default this messages simply calls the Cancel message
                    return [{}];
            }

            // Call the update function for all other Form messages
            return form.update(model, msg, props);
    }
};
~~~

In your UI component you can dispatch the `valueChanged` message to update one or more values:

~~~tsx
const { values: { userName, password } } = model;

return (
    <>
        <input value={userName} onChange={event => dispatch(Msg.valueChanged({ userName: event.target.value }))} />
        <input value={password} onChange={event => dispatch(Msg.valueChanged({ password: event.target.value }))} />
    </>
);
~~~

To accept or cancel the form dispatch the `acceptRequest` and `cancelRequest` Form messages in the onClick event handlers of the buttons.

The `createForm` function takes an `Options` object:

| Property | Description |
| --- | --- |
| `initValues` | Function to set the initial form values. |
| `validate` | (optional) Function to validate the data when the user accepts the form. It returns an array of `IValidationError`s. See [Validation](#validation). The `validate` function is not called when `validators` is specified. |
| `onAccept` | (optional) Function which get called by the **Accept** message. You can add code here to accept the form. |
| `onCancel` | (optional) Function which get called by the **Cancel** message. You can add code here to cancel the form. |
| `onValueChange` | (optional) Function which get called by the **ValueChanged** message. You can add code here to modify the changed values. |

#### Hook into or overwrite messages

To make the form work, you need to overwrite at least the **Accept** and the **Cancel** messages, or provide `onAccept` and `onCancel` to the form options.

By default **CancelRequest** only calls **Cancel**. If you want to override this behavior, i.e. to show some confirmation to the user, also overwrite  this message.

~~~ts
export const update = (model: Model, msg: Message, props: Props): UpdateReturnType<Model, Message> => {
    switch (msg.source) {
        case "Form":
            switch (msg.name) {
                case "Accept":
                    // Close the form here and provide the values
                    return [{}];

                case "Cancel":
                    // Close the form here
                    return [{}];

                case "CancelRequest":
                    return [{}, cmd.ofPromise.perform(showConfirmation, Msg.cancel)];

                default:
                    return form.update(model, msg, props);
            }
        case "Local":
            return localUpdate(model, msg);
    }
};
~~~

### Validation

This module contains some helper functions and types for validation.

| Function/Type | Description |
| --- | --- |
| `Validator` | Tuple consisting of a string (key for an error) and a `ValidatorFunc`. |
| `ValidatorFunc` | Executes a validation and returns an error message or null. |
| `runValidation` | This function executes `Validator`s and returns an array of `IValidationError`s. |
| `getError` | Extracts an error message for a specified key out of an array of `IValidationError`s. Can be used in the UI to get an error message for a specific control. |

#### Example: Use validation in Form

You can assign a validation function to the `Options` object when creating a form.

~~~ts
import * as Form from "react-elmish-utils/dist/Form";
import { IValidationError, runValidation } from "react-elmish-utils";

...
// Validate the inputs of a Form
const validate = (model: Model, prop: Props): Promise<IValidationError []> => {
    const validateValue = (): Nullable<string> => {
        if (!model.value) {
            return "Value is missing";
        }

        return null;
    };

    // Pass one or more tuples consisting of a key and a ValidatorFunc to runValidation
    return runValidation(["value", validateValue]);
};

// Create the Form object with the validation
const form = Form.createForm({
    // ...
    validate,
});
...
~~~

In the UI you get a validation error like that:

~~~tsx
import { getError } from "react-elmish-utils";

...
// in the render function of a react component
const { errors } = this.model;

<Input
    ...
    error={getError("value", errors)}
/>
...
~~~
