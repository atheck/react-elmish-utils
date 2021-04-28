# react-elmish-utils

![Build](https://github.com/atheck/react-elmish-utils/actions/workflows/main.yml/badge.svg)
![npm](https://img.shields.io/npm/v/react-elmish-utils)

Utility functions and types for [react-elmish](https://www.npmjs.com/package/react-elmish).

## Installation

`npm install react-elmish-utils`

## Basic Usage

### Form

The Form module handles the following tasks:

* **Accept**: the form is submitted
* **Cancel**: the user cancels the form
* **Validation**: is done when the user accepts the form (see [Validation](#validation))

~~~ts
import * as Form from "react-elmish-utils/dist/Form";
import { MsgSource, UpdateReturnType } from "react-elmish";

// Source type for our own messages
type Source = MsgSource<"Local">;

// Our messages
type LocalMessage =
    | { name: "ValueChanged", value: string } & Source
    ;

// Include the Form messages
export type Message =
    | LocalMessage
    | Form.Message
    ;

const source: Source = { source: "Local" };

// Include Form convenience functions
export const Msg = {
    valueChanged: (value: string): Message => ({ name: "ValueChanged", value, ...source }),
    ...Form.Msg,
};

// Add Form Model to our model
export type Model = Readonly<{
    value: string,
}> & Form.Model;

// The data to return when the user accepts the form
type FormData = {
    value: string,
};

// Add Form Props to our Props
export type Props = {
    // props here
} & Form.Props<FormData>;

export const update = (model: Model, msg: Message, props: Props): UpdateReturnType<Model, Message> => {
    // Distinguish between our messages and Form messages
    switch (msg.source) {
        case "Form":
            // Call the update function for Form messages
            return Form.update(model, msg, props, {
                // getData is called when the user accepts the form and the data passes validation
                getData: () => ({
                    value: model.value,
                }),
            });
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

In your UI component you can dispatch the `accept` and `cancel` messages in the onClick event handlers of the OK or Cancel button.

The `update` function takes an `UpdateOptions` object:

| Property | Description |
| --- | --- |
| `getData` | Function to create the form data that is passed to `onAccept`. |
| `validators` | (optional) Array of `Validator`s. These are executed when the user accepts the form. See [Validation](#validation) |
| `validate` | (optional) Function to validate the data when the user accepts the form. It returns an array of `IValidationError`s. See [Validation](#validation). The `validate` function is not called when `validators` is specified. |
| `onCancelRequest` | (optional) When this function is specified, it is called when the user cancels the form and the modified flag is set to `true`. You can modify the model and dispatch a message in this function, maybe to show a confirmation dialog first. To cancel the form dispatch the `execCancel` message. |

## Validation

TODO
