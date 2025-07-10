import { cmd, type UpdateMap } from "react-elmish";
import { type Filter, type FilterGroup, type FilterGroupDefinition, type SearchFunc, search } from "./Search";

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

	return {
		// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
		Msg,
		init(): Model<TData> {
			return {
				query: "",
				items: [],
				visibleItems: [],
				filterGroups: options.filterGroups?.map((group) => ({
					...group,
					filters: group.filters.map((filter) => ({ ...filter, active: filter.active ?? false })),
				})),
			};
		},
		updateMap: {
			queryChanged({ query }) {
				return [{ query } as Partial<CompositeModel<TModel, TData>>, cmd.ofMsg(Msg.refreshSearch())];
			},

			toggleFilter({ filter }, { filterGroups }) {
				if (!filterGroups) {
					return [{}];
				}

				filter.active = !filter.active;

				const updatedGroups = filterGroups.map((group) => {
					if (!group.filters.includes(filter)) {
						return group;
					}

					if (filter.active && group.toggleMode) {
						for (const groupFilter of group.filters) {
							groupFilter.active = groupFilter === filter;
						}
					}

					if (!filter.active && !group.noneActiveAllowed) {
						const firstActiveFilter = group.filters.find((current) => current.active);

						if (!firstActiveFilter && group.filters[0]) {
							group.filters[0].active = true;
						}
					}

					return group;
				});

				return [{ filterGroups: updatedGroups } as Partial<CompositeModel<TModel, TData>>, cmd.ofMsg(Msg.refreshSearch())];
			},

			refreshSearch(_msg, model) {
				const visibleItems = search({
					query: model.query,
					items: model.items,
					filterGroups: model.filterGroups,
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
