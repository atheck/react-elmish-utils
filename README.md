# react-elmish-utils

![Build](https://github.com/atheck/react-elmish-utils/actions/workflows/release.yml/badge.svg)
![npm](https://img.shields.io/npm/v/react-elmish-utils)

Utility functions and types for [react-elmish](https://www.npmjs.com/package/react-elmish).

[[_TOC_]]

## Installation

`npm install react-elmish-utils`

## Usage

### Dependency Injection

You can use the function `initWithDependencies` to get a wrapper around the `useElmish` hook.

```ts
const dependencies = {
    // Contains dependencies
}

const { useElmish } = initWithDependencies({ /* Elmish options */ }, dependencies);
```

Instead of using the `useElmish` hook from the `react-elmish` package directly, you can use the returned hook in your components. With that you can use a function around the `init`, the `update`, and the `subscription` functions:

```ts
// This function can also have a return type of ElmishStateFunction if you are using an update function instead of a map.
function createState(dependencies): ElmishStateMap<Props, State, Message> {
    // Here you can access the dependencies

    function init(props: Props): InitResult<State, Message> {
        return [{
            // init state here
        }];
    }
    const update: UpdateMap<Props, State, Message> = {
        // update functions
    };

    return {
        init,
        update,
        // optional subscription
    };
}
```

You need to pass the `createState` function to the `useElmish` hook.

#### Testing

To test your `init` and `update` functions, you can use the `getElmishState` or `getElmishStateFactory` functions from `react-elmish-utils/dist/Testing`:

```ts
function initProps(): Props {
    return {
        // initial props
    };
}

const { createUpdateArgs, init, update, updateAndExecCmd } = getElmishState(createState, initProps, dependencies);
// or
const createStateWithDependencies = getElmishStateFactory(createState, initProps);
const { createUpdateArgs, init, update, updateAndExecCmd } = createStateWithDependencies(dependencies);
```

To test React components with dependencies you can use the `renderWithDependencies` function from `react-elmish-utils/dist/Testing`:

```tsx
renderWithDependencies(() => <Component />, {
    dependencies: { /* optional mocked dependencies */ },
    model: { /* mocked model */ }
    dispatch: jest.fn(), // optional
});
```

This renders the component using the dependencies, model, and dispatch function you pass in.

### Form

This module handles common tasks of a form.

If you want to use a function component and use an `UpdateMap`, you can use the `FormMap`.

#### FormMap Example

```ts
import { createFormMap, FormMapMessage, FormModel } from "react-elmish-utils";
import { cmd, InitResult, UpdateReturnType } from "react-elmish";

// The fields of the form
interface FormData {
    userName: string,
    password: string,
}

// We need the Form messages only
export type Message =
    | FormMapMessage<FormData>;

// Add the Form model to our model
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

const Msg = {
    ...form.Msg,
};

function init (props: Props): InitResult<Model, Message> {
    return [
        {
            // Initialize the Form model
            ...form.init(props),
        },
    ];
}

// Add the Form update map to our update map
const updateMap: UpdateMap<Props, Model, Message> = {
    ...form.updateMap,
};
```

In your UI component you can dispatch the `valueChanged` message to update one or more values:

```tsx
function Form (props: Props): JSX.Element {
    const [{ values }, dispatch] = useElmish({ name: "Form", props, init, updateMap });
    const { userName, password } = values;

    return (
        <>
            <input value={userName} onChange={event => dispatch(Msg.valueChanged({ userName: event.target.value }))} />
            <input value={password} onChange={event => dispatch(Msg.valueChanged({ password: event.target.value }))} />
        </>
    );
}
```

To accept or cancel the form dispatch the `acceptRequest` and `cancelRequest` Form messages in the onClick event handlers of the buttons.

The `createFormMap` function takes an `Options` object:

| Property | Description |
| --- | --- |
| `initValues` | Function to set the initial form values. |
| `validate` | (optional) Function to validate the data when the user accepts the form. It returns an array of `ValidationError`s. See [Validation](#validation). The `validate` function is not called when `validators` is specified. |
| `onValueChange` | (optional) This function is called if one ore more values were changed. You can add code here to modify the changed values. |
| `onValidated` | (optional) This function is called after the validation. |
| `onCancel` | (optional) This function is called if the form should be cancelled. You can add code here to cancel the form. |
| `onAccept` | (optional) This function is called if the form should be accepted. You can add code here to accept the form. |

#### Hook into or overwrite messages

To make the form work, you need to overwrite at least the **accept** and the **cancel** messages, or provide `onAccept` and `onCancel` to the form options.

By default **cancelRequest** only calls **cancel**. If you want to override this behavior, i.e. to show some confirmation to the user, also overwrite  this message.

```ts
const updateMap: UpdateMap<Props, Model, Message> = {
    ...form.updateMap,
    cancelRequest: () => [{}, cmd.ofPromise.perform(showConfirmation, Msg.cancel)],
};
```

#### Form Example

For Class Components or with usage of an `update` function, you need to use the classic way of composition:

```ts
import { createForm, FormModel, FormMessage } from "react-elmish-utils";
import { cmd, InitResult, UpdateReturnType } from "react-elmish";

// The fields of the form
interface FormData {
    userName: string,
    password: string,
}

// Add Form model to our model
interface Model extends FormModel<FormData> {}

interface Props {
    initialUserName: string,
}

// Create the form object with options
const form = createForm({
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
type Message =
    | FormMessage<FormData>;

const Msg = {
    ...form.Msg,
};

function init (props: Props): InitResult<Model, Message> {
    return [
        {
            // Initialize the Form model
            ...form.init(props),
        },
    ];
}

function update (model: Model, msg: Message, props: Props): UpdateReturnType<Model, Message> {
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
}
```

In your UI component you can dispatch the `valueChanged` message to update one or more values:

```tsx
const { values: { userName, password } } = model;

return (
    <>
        <input value={userName} onChange={event => dispatch(Msg.valueChanged({ userName: event.target.value }))} />
        <input value={password} onChange={event => dispatch(Msg.valueChanged({ password: event.target.value }))} />
    </>
);
```

To accept or cancel the form dispatch the `acceptRequest` and `cancelRequest` Form messages in the onClick event handlers of the buttons.

The `createForm` function takes an `Options` object:

| Property | Description |
| --- | --- |
| `initValues` | Function to set the initial form values. |
| `validate` | (optional) Function to validate the data when the user accepts the form. It returns an array of `ValidationError`s. See [Validation](#validation). The `validate` function is not called when `validators` is specified. |
| `onValueChange` | (optional) This function is called if one ore more values were changed. You can add code here to modify the changed values. |
| `onValidated` | (optional) This function is called after the validation. |
| `onCancel` | (optional) This function is called if the form should be cancelled. You can add code here to cancel the form. |
| `onAccept` | (optional) This function is called if the form should be accepted. You can add code here to accept the form. |

#### Hook into or overwrite messages

To make the form work, you need to overwrite at least the **Accept** and the **Cancel** messages, or provide `onAccept` and `onCancel` to the form options.

By default **CancelRequest** only calls **Cancel**. If you want to override this behavior, i.e. to show some confirmation to the user, also overwrite  this message.

```ts
function update (model: Model, msg: Message, props: Props): UpdateReturnType<Model, Message> {
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
}
```

### Validation

This module contains some helper functions and types for validation.

| Function/Type | Description |
| --- | --- |
| `ValidationError` | Represents a validation error. |
| `Validator` | Tuple consisting of a string (key for an error) and a `ValidatorFunc`. |
| `ValidatorFunc` | Executes a validation and returns an error message or null. |
| `runValidation` | This function executes `Validator`s and returns an array of `ValidationError`s. |
| `getError` | Extracts an error message for a specified key out of an array of `ValidationError`s. Can be used in the UI to get an error message for a specific control. But it is recommended to use the `getError` function of the created form object. |

#### Example: Use validation in FormMap

You can pass a validation function to the `Options` object when creating a form.

```ts
import { createFormMap, ValidationError, runValidation } from "react-elmish-utils";

// The fields of the form
interface FormData {
    userName: string,
    password: string,
}

// Create the Form object with the validation
const form = createFormMap({
    // ...
    validate,
});

...
// Validate the inputs of a Form
function validate ({ values }: Model, prop: Props): Promise<ValidationError<keyof FormData> []> {
    const validateUserName = (): Nullable<string> => {
        if (!values.userName) {
            return "Username is missing";
        }

        return null;
    };
    const validatePassword = (): Nullable<string> => {
        if (!values.password) {
            return "Password is missing";
        }

        return null;
    };

    // Pass one or more tuples consisting of a key and a ValidatorFunc to runValidation
    return runValidation<keyof FormData>(
        ["userName", validateUserName],
        ["password", validatePassword],
    );
}

...
```

In the UI you get a validation error like that:

```tsx
...
// in the render function of a react component
const { errors } = this.model;

// The created form returns a `getError` function which can be used to get an error message for a specific key
<Input
    ...
    error={form.getError("userName", errors)}
/>
...
```

By default the validation keys are the keys of the form values. If you want to use different keys, you can pass a second type parameter to the forms model and the forms message type:

```ts
type ValidationErrorKeys = "name" | "age";

interface Model extends FormModel<FormData, ValidationErrorKeys> {}

type Message =
    | FormMessage<FormData, ValidationErrorKeys>;

type MyValidationError = ValidationError<ValidationErrorKeys>;
```

### List screen

The list screen provides common functionalities for showing a list of items.

First you need to extend your messages and model:

```ts
import { ListScreenMessage, ListScreenModel } from "react-elmish-utils";

interface Data {}

type Message =
    | { name: "loadData" }
    | ListScreenMessage<Data>;

interface Model extends ListScreenModel<Data> {}
```

Then create a list:

```ts
import { createList } from "react-elmish-utils";

const list = createList();

const Msg = {
    // Spread the message factories of the list:
    ...list.Msg,
}

function init (): InitResult<Model, Message> {
    return {
        // Initialize the list model:
        ...list.init(),
    };
}

const update: UpdateMap<Props, Model, Message> = {
    loadData () {
        const data = // Load the data here ...

        // Call the dataLoaded message of the list:
        return [{}, cmd.ofMsg(Msg.dataLoaded(data))];
    },

    // Spread the update map of the list:
    ...list.updateMap,
};
```

In your UI you can use the `items` property of the model:

```tsx
function List (props: Props): JSX.Element {
    const [{ items }, dispatch] = useElmish({ name: "List", props, init, update });

    return (
        <List
            data={items}
        />
    );
}
```

#### List Options

You can provide options when creating a list:

| Property | Description |
| --- | --- |
| `sorter` | See [Sorting](#sorting). |
| `onUpdateSorting` | This callback is called whenever the current sorting has changed. |
| `onSorterChanged` | This callback is called when the used `Sorter` or the sort direction has changed. |

#### Sorting

You can sort the list by providing a sort function or an array of `Sorter` objects.

If you provide a function, this function is used to sort the items.

```ts
createList({
    sorter: (value1, value2): number => value1.compareTo(value2),
});
```

If you provide one or multiple `Sorter` objects the first one is used by default.

```ts
createList({
    sorter: [
        {
            key: "by-date",
            name: "Sort by date",
            sorter: (value1, value2) => value1.date.compareTo(value2.date),
        },
        {
            key: "by-name",
            name: "Sort by name",
            sorter: (value1, value2) => value1.name.compareTo(value2.name),
        },
    ],
});
```

The current `Sorter` can be changed by calling the `setSorter` or the `setSorting` message with the key of the `Sorter` to use.

The sort direction can be changed by calling the `setSortDirection` or `toggleSortDirection` message.

### Search screen

The search screen provides common functionalities of a search screen.

First you need to extend your messages and model:

```ts
import { SearchScreenMessage, SearchScreenModel } from "react-elmish-utils";

interface Data {}

type Message =
    | { name: "loadData" }
    | SearchScreenMessage<Data>;

interface Model extends SearchScreenModel<Data> {}
```

Then create a search screen:

```ts
import { createSearch } from "react-elmish-utils";

const search = createSearch();

const Msg = {
    // Spread the message factories of the search object:
    ...search.Msg,
}

function init (): InitResult<Model, Message> {
    return {
        // Initialize the search model:
        ...search.init(),
    };
}

const update: UpdateMap<Props, Model, Message> = {
    loadData () {
        const data = // Load the data here ...

        // Call the refreshSearch message of the search object:
        return [{}, cmd.ofMsg(Msg.refreshSearch())];
    },

    // Spread the update map of the search object:
    ...search.updateMap,
};
```

In your UI you can use the `visibleItems` property of the model:

```tsx
function List (props: Props): JSX.Element {
    const [{ visibleItems }, dispatch] = useElmish({ name: "Search", props, init, update });

    return (
        <List
            data={visibleItems}
        />
    );
}
```

#### Search Options

You can provide options when creating a list:

| Property | Description |
| --- | --- |
| `filterByQuery` | A function to filter the items by the query string. |
| `filters` | Optional array of `FilterDefinition`s. |

#### Filtering

To update the query string dispatch the `queryChanged` message and pass the new query string.

To toggle the state of filter dispatch the `toggleFilter` message and pass the filter to toggle.
