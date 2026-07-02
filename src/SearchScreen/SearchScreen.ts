import { cmd, type UpdateMap } from "react-elmish";
import { search } from "./Search";
import {
	type CompositeModel,
	createInit,
	createMsg,
	type Message,
	type Model,
	type Msg as MsgObject,
	type Options,
} from "./shared";

interface Search<TModel, TProps, TData> {
	/**
	 * Object to create messages.
	 */
	// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
	Msg: MsgObject<TData>;
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
	const Msg = createMsg<TData>();

	return {
		// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
		Msg,
		init: createInit(options),
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

export type { Message, Model, Msg, Options } from "./shared";

export { createSearch };
