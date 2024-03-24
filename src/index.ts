import { initWithDependencies, type ElmishStateFunction, type ElmishStateMap } from "./ElmishDi";
import { createForm, type Form, type Message as FormMessage, type Model as FormModel, type Options as FormOptions } from "./Form";
import { createFormMap, type FormMap, type Message as FormMapMessage } from "./FormMap";
import {
	createList,
	type Message as ListScreenMessage,
	type Model as ListScreenModel,
	type Msg as ListScreenMsg,
	type Options as ListScreenOptions,
	type SortDirection,
	type SortFunc,
	type Sorter,
} from "./ListScreen";
import {
	createSearch,
	type Filter,
	type FilterDefinition,
	type Message as SearchScreenMessage,
	type Model as SearchScreenModel,
	type Msg as SearchScreenMsg,
	type Options as SearchScreenOptions,
} from "./SearchScreen";
import {
	getError,
	runValidation,
	type ValidationError,
	type ValidationKey,
	type Validator,
	type ValidatorFunc,
} from "./Validation";

export type {
	ElmishStateFunction,
	ElmishStateMap,
	Filter,
	FilterDefinition,
	Form,
	FormMap,
	FormMapMessage,
	FormMessage,
	FormModel,
	FormOptions,
	ListScreenMessage,
	ListScreenModel,
	ListScreenMsg,
	ListScreenOptions,
	SearchScreenMessage,
	SearchScreenModel,
	SearchScreenMsg,
	SearchScreenOptions,
	SortDirection,
	SortFunc,
	Sorter,
	ValidationError,
	ValidationKey,
	Validator,
	ValidatorFunc,
};

export { createForm, createFormMap, createList, createSearch, getError, initWithDependencies, runValidation };
