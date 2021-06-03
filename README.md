# react-elmish-utils

![Build](https://github.com/atheck/react-elmish-utils/actions/workflows/main.yml/badge.svg)
![npm](https://img.shields.io/npm/v/react-elmish-utils)

Utility functions and types for [react-elmish](https://www.npmjs.com/package/react-elmish).

## Installation

`npm install react-elmish-utils`

## Usage

### Form

The Form module handles the following tasks:

* **Accept**: the form is submitted
* **Cancel**: the user cancels the form
* **Validation**: is done when the user accepts the form (see [Validation](#validation))

#### Example

~~~ts
import * as Form from "react-elmish-utils/dist/Form";
import { MsgSource, UpdateReturnType } from "react-elmish";

// Source type for our own messages
type Source = MsgSource<"Local">;

// Our messages
type LocalMessage =
    | { name: "ValueChanged", value: string } & Source
    ;

// Combine our messages and Form messages
export type Message =
    | LocalMessage
    | Form.Message
    ;

const source: Source = { source: "Local" };

export const Msg = {
    valueChanged: (value: string): Message => ({ name: "ValueChanged", value, ...source }),
};

// Add Form model to our model
export type Model = Readonly<{
    value: string,
    modified: boolean,
}> & Form.Model;

// The data to return when the user accepts the form
type FormData = {
    value: string,
};

// Add Form props to our props
export type Props = {
    // props here
} & Form.Props<FormData>;

const cmd = createCmd<Message>();

// Create the form object with options
const form = Form.createForm({
    // getData is called when the user accepts the form and the data passes validation
    getData: (model: Model) => ({
        value: model.value,
    }),
});

export const init = (): [Model, Cmd<Message>] => {
    return [
        {
            // Initialize the Form model
            ...form.init(),
            value: "",
            modified: false,
        },
        cmd.none
    ];
};

export const update = (model: Model, msg: Message, props: Props): UpdateReturnType<Model, Message> => {
    // Distinguish between our messages and Form messages
    switch (msg.source) {
        case "Form":
            // Call the update function for Form messages
            return form.update(model, msg, props);
        case "Local":
            // Call the update function for our messages
            return localUpdate(model, msg);
    }
};

const localUpdate = (model: Model, msg: LocalMessage): UpdateReturnType<Model, LocalMessage> => {
    switch (msg.name) {
        case "ValueChanged":
            // Change some value and set modified to true
            return [{ value: msg.value, modified: true }];
    }
};
~~~

In your UI component you can dispatch the `accept` and `cancelRequest` Form messages in the onClick event handlers of the OK or Cancel button.

The `createForm` function takes an `FormOptions` object:

| Property | Description |
| --- | --- |
| `getData` | Function to create the form data that is passed to `onAccept`. |
| `validate` | (optional) Function to validate the data when the user accepts the form. It returns an array of `IValidationError`s. See [Validation](#validation). The `validate` function is not called when `validators` is specified. |
| `onCancelRequest` | (optional) When this function is specified, it is called when the user cancels the form. You can modify the model and dispatch a message in this function, maybe to show a confirmation dialog first. To cancel the form dispatch the `cancel` message. |

### Validation

This module contains some helper functions and types for validation.

| Function/Type | Description |
| --- | --- |
| `Validator` | Tuple consisting of a string (key for an error) and a `ValidatorFunc`. |
| `ValidatorFunc` | Executes a validation and returns an error message or null. |
| `runValidation` | This function executes `Validator`s and returns an array of `IValidationError`s. |
| `getError` | Extracts an error message for a specified key out of an array of `IValidationError`s. Can be used in the UI to get an error message for a specific control. |

#### Example: Use validation in Form

You can assign a validation function to the `FormOptions` object when creating a form.

~~~ts
import * as Form from "react-elmish-utils/dist/Form";
import { IValidationError, runValidation } from "react-elmish-utils";

...
// Validate the inputs of a Form
const validate = (model: Model, prop: Props): IValidationError [] => {
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
