import { type UpdateMap, type UpdateReturnType, cmd } from "react-elmish";
import { type Filter, type FilterDefinition, type SearchFunc, search } from "./Search";

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
	filters?: Filter<TData>[];
}

interface Options<TData> {
	/**
	 * The function to filter one item of the list by the given query string.
	 */
	filterByQuery: SearchFunc<TData>;
	/**
	 * Optional list of filter definitions.
	 */
	filters?: FilterDefinition<TData>[];
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

interface Search<TModel, TProps, TData> {
	/**
	 * Object to create messages.
	 */
	// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
	Msg: Msg<TData>;
	/**
	 * Initializes the search screen model.
	 * Call this in your init function.
	 */
	init: () => Model<TData>;
	/**
	 * Update map to update the model.
	 * Spread this into your update map.
	 */
	updateMap: UpdateMap<TProps, CompositeModel<TModel, TData>, Message<TData>>;
}

/**
 * Creates a search screen object.
 * Don't forget to dispatch the refreshSearch message every time the items change.
 * @param options The options for the search screen.
 * @returns The created search object.
 */
function createSearch<TModel, TProps, TData>(options: Options<TData>): Search<TModel, TProps, TData> {
	const Msg: Msg<TData> = {
		queryChanged: (query: string): Message<TData> => ({ name: "queryChanged", query }),
		toggleFilter: (filter: Filter<TData>): Message<TData> => ({ name: "toggleFilter", filter }),
		refreshSearch: (): Message<TData> => ({ name: "refreshSearch" }),
	};

	const handleToggleFilter = (
		model: CompositeModel<TModel, TData>,
		filter: Filter<TData>,
	): UpdateReturnType<CompositeModel<TModel, TData>, Message<TData>> => {
		if (!model.filters) {
			return [{}];
		}

		const filterIndex = model.filters.indexOf(filter);

		if (filterIndex < 0) {
			return [{}];
		}

		model.filters.splice(filterIndex, 1, {
			...filter,
			active: !filter.active,
		});

		return [{ filters: [...model.filters] } as Partial<CompositeModel<TModel, TData>>, cmd.ofMsg(Msg.refreshSearch())];
	};

	return {
		Msg,
		init(): Model<TData> {
			return {
				query: "",
				items: [],
				visibleItems: [],
				filters: options.filters?.map((filterDefinition) => ({
					...filterDefinition,
					active: filterDefinition.active ?? false,
				})),
			};
		},
		updateMap: {
			queryChanged({ query }) {
				return [{ query } as Partial<CompositeModel<TModel, TData>>, cmd.ofMsg(Msg.refreshSearch())];
			},

			toggleFilter(msg, model) {
				return handleToggleFilter(model, msg.filter);
			},

			refreshSearch(_msg, model) {
				const visibleItems = search({
					query: model.query,
					items: model.items,
					filters: model.filters,
					filterByQuery: options.filterByQuery,
					showAllItemsByDefault: options.showAllItemsByDefault ?? false,
				});

				return [{ visibleItems } as Partial<CompositeModel<TModel, TData>>];
			},
		},
	};
}

export type { Message, Model, Msg, Options };

export { createSearch };
