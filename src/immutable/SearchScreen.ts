import { original } from "immer";
import { cmd, type UpdateMap } from "react-elmish/immutable";
import { type FilterGroup, search } from "../SearchScreen/Search";
import {
	type CompositeModel,
	createInit,
	createMsg,
	type Message,
	type Model,
	type Msg as MsgObject,
	type Options,
} from "../SearchScreen/shared";
import { asWritable, snapshot } from "./draft";

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
 * Creates a search screen object for the immutable react-elmish API.
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
			queryChanged({ query }, draft) {
				asWritable(draft).query = query;

				return [cmd.ofMsg(Msg.refreshSearch())];
			},

			toggleFilter({ filter }, draft) {
				const { filterGroups } = asWritable(draft);

				if (!filterGroups) {
					return [];
				}

				for (const group of filterGroups) {
					// The `filter` carried by the message references the previous (frozen) model, so it is
					// never reference-equal to the current draft. Match it via its original base object.
					const target = group.filters.find((candidate) => candidate === filter || original(candidate) === filter);

					if (!target) {
						continue;
					}

					target.active = !target.active;

					if (target.active && group.toggleMode) {
						for (const groupFilter of group.filters) {
							groupFilter.active = groupFilter === target;
						}
					}

					if (!target.active && !group.noneActiveAllowed) {
						const firstActiveFilter = group.filters.find((candidate) => candidate.active);

						if (!firstActiveFilter && group.filters[0]) {
							group.filters[0].active = true;
						}
					}

					break;
				}

				return [cmd.ofMsg(Msg.refreshSearch())];
			},

			refreshSearch(_msg, draft) {
				const model = asWritable(draft);
				const draftGroups = draft.filterGroups;
				const filterGroups = draftGroups ? snapshot<FilterGroup<TData>[]>(draftGroups) : undefined;

				model.visibleItems = search({
					query: model.query,
					items: snapshot<TData[]>(draft.items),
					filterGroups,
					filterByQuery: options.filterByQuery,
					showAllItemsByDefault: options.showAllItemsByDefault ?? false,
				});

				return [];
			},
		},
	};
}

export type { Search };

export { createSearch };
