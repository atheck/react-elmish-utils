import { cmd, type UpdateMap } from "react-elmish/immutable";
import {
	createInit,
	createMsg,
	getCurrentSorter,
	getSorterByKey,
	type Message,
	type Model,
	type Msg as MsgObject,
	type Options,
	sortDescending,
} from "../ListScreen/shared";
import { asWritable, snapshot } from "./draft";

interface List<TModel, TProps, TData, TSortKey extends string = string> {
	// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
	Msg: MsgObject<TData, TSortKey>;
	init: () => Model<TData, TSortKey>;
	updateMap: UpdateMap<TProps, Model<TData, TSortKey> & TModel, Message<TData, TSortKey>>;
}

function createList<TModel, TProps, TData, TSortKey extends string = string>(
	options: Options<TModel, TProps, TData, TSortKey> = {},
): List<TModel, TProps, TData, TSortKey> {
	const Msg = createMsg<TData, TSortKey>();

	return {
		// biome-ignore lint/style/useNamingConvention: This is an elmish naming convention.
		Msg,
		init: createInit(options),
		updateMap: {
			dataLoaded({ data }, draft) {
				asWritable(draft).items = data;

				return [cmd.ofMsg(Msg.refresh())];
			},

			refresh(_msg, draft) {
				const model = asWritable(draft);
				const currentSorter = getCurrentSorter(model.currentSorterKey, options.sorter);

				if (currentSorter) {
					const items = snapshot<TData[]>(draft.items);

					model.items = model.sortDirection === "asc" ? items.toSorted(currentSorter) : sortDescending(items, currentSorter);
				}

				return [];
			},

			setSorter({ key, toggleDirection }, draft, props) {
				const model = asWritable(draft);

				if (key === model.currentSorterKey) {
					if (toggleDirection) {
						return [cmd.ofMsg(Msg.toggleSortDirection())];
					}

					return [];
				}

				const sorter = getSorterByKey(key, options.sorter);

				if (sorter) {
					options.onSorterChanged?.(sorter, model.sortDirection);
				}

				options.onUpdateSorting?.(snapshot(draft), props, {
					key,
					direction: model.sortDirection,
				});

				model.currentSorterKey = key;

				return [cmd.ofMsg(Msg.refresh())];
			},

			setSortDirection({ direction }, draft, props) {
				const model = asWritable(draft);

				options.onUpdateSorting?.(snapshot(draft), props, {
					key: model.currentSorterKey,
					direction,
				});

				model.sortDirection = direction;

				return [cmd.ofMsg(Msg.refresh())];
			},

			toggleSortDirection(_msg, draft, props) {
				const model = asWritable(draft);
				const sorter = getSorterByKey(model.currentSorterKey, options.sorter);
				const sortDirection = model.sortDirection === "asc" ? "desc" : "asc";

				if (sorter) {
					options.onSorterChanged?.(sorter, sortDirection);
				}

				options.onUpdateSorting?.(snapshot(draft), props, {
					key: model.currentSorterKey,
					direction: sortDirection,
				});

				model.sortDirection = sortDirection;

				return [cmd.ofMsg(Msg.refresh())];
			},

			setSorting({ key, direction }, draft) {
				const model = asWritable(draft);

				model.currentSorterKey = key;
				model.sortDirection = direction;

				return [cmd.ofMsg(Msg.refresh())];
			},
		},
	};
}

export type { List };

export { createList };
