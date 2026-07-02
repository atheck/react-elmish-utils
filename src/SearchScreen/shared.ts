import type { Filter, FilterGroup, FilterGroupDefinition, SearchFunc } from "./Search";

type Message<TData> =
	| { name: "queryChanged"; query: string }
	| { name: "toggleFilter"; filter: Filter<TData> }
	| { name: "refreshSearch" };

/**
 * Model for a screen to search and filter items.
 */
interface Model<TData> {
	/**
	 * The query string.
	 */
	query: string;
	items: TData[];
	/**
	 * Contains all visible items.
	 */
	visibleItems: TData[];
	/**
	 * Optional list of filters.
	 */
	filterGroups?: FilterGroup<TData>[];
}

interface Options<TData> {
	/**
	 * The function to filter one item of the list by the given query string.
	 */
	filterByQuery: SearchFunc<TData>;
	/**
	 * Optional list of filter definitions.
	 */
	filterGroups?: FilterGroupDefinition<TData>[];
	/**
	 * If set to true, all items are shown if the query is empty and no filters are set.
	 */
	showAllItemsByDefault?: boolean;
}

type CompositeModel<TModel, TData> = Model<TData> & TModel;

interface Msg<TData> {
	/**
	 * Updates the query string.
	 */
	queryChanged: (query: string) => Message<TData>;
	/**
	 * Toggles the given filter.
	 */
	toggleFilter: (filter: Filter<TData>) => Message<TData>;
	/**
	 * Refreshes the search result.
	 * Dispatch this message when the items changed.
	 */
	refreshSearch: () => Message<TData>;
}

/**
 * Creates the `Msg` object with the search message creators.
 * @returns The `Msg` object.
 */
function createMsg<TData>(): Msg<TData> {
	return {
		queryChanged: (query: string): Message<TData> => ({ name: "queryChanged", query }),
		toggleFilter: (filter: Filter<TData>): Message<TData> => ({ name: "toggleFilter", filter }),
		refreshSearch: (): Message<TData> => ({ name: "refreshSearch" }),
	};
}

/**
 * Creates the initial search screen model.
 * @param options The search screen options.
 * @returns The `init` function.
 */
function createInit<TData>(options: Options<TData>): () => Model<TData> {
	return (): Model<TData> => ({
		query: "",
		items: [],
		visibleItems: [],
		filterGroups: options.filterGroups?.map((group) => ({
			...group,
			filters: group.filters.map((filter) => ({ ...filter, active: filter.active ?? false })),
		})),
	});
}

export type { CompositeModel, Message, Model, Msg, Options };

export { createInit, createMsg };
