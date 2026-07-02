import { cmd, type UpdateMap } from "react-elmish";
import {
	createInit,
	createMsg,
	getCurrentSorter,
	getSorterByKey,
	type Message,
	type Model,
	type Msg as MsgObject,
	type Options,
	type SortFunc,
	sortDescending,
} from "./shared";

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
			dataLoaded({ data }) {
				return [{ items: data } as Partial<Model<TData, TSortKey> & TModel>, cmd.ofMsg(Msg.refresh())];
			},

			refresh(_msg, model) {
				const currentSorter: SortFunc<TData> | null = getCurrentSorter(model.currentSorterKey, options.sorter);

				if (currentSorter) {
					const items =
						model.sortDirection === "asc" ? model.items.toSorted(currentSorter) : sortDescending(model.items, currentSorter);

					return [{ items } as Partial<Model<TData, TSortKey> & TModel>];
				}

				return [{}];
			},

			setSorter({ key, toggleDirection }, model, props) {
				if (key === model.currentSorterKey) {
					if (toggleDirection) {
						return [{}, cmd.ofMsg(Msg.toggleSortDirection())];
					}

					return [{}];
				}

				const sorter = getSorterByKey(key, options.sorter);

				if (sorter) {
					options.onSorterChanged?.(sorter, model.sortDirection);
				}

				if (options.onUpdateSorting) {
					options.onUpdateSorting(model, props, {
						key,
						direction: model.sortDirection,
					});
				}

				return [{ currentSorterKey: key } as Partial<Model<TData, TSortKey> & TModel>, cmd.ofMsg(Msg.refresh())];
			},

			setSortDirection({ direction }, model, props) {
				if (options.onUpdateSorting) {
					options.onUpdateSorting(model, props, {
						key: model.currentSorterKey,
						direction,
					});
				}

				return [{ sortDirection: direction } as Partial<Model<TData, TSortKey> & TModel>, cmd.ofMsg(Msg.refresh())];
			},

			toggleSortDirection(_msg, model, props) {
				const sorter = getSorterByKey(model.currentSorterKey, options.sorter);
				const sortDirection = model.sortDirection === "asc" ? "desc" : "asc";

				if (sorter) {
					options.onSorterChanged?.(sorter, sortDirection);
				}

				if (options.onUpdateSorting) {
					options.onUpdateSorting(model, props, {
						key: model.currentSorterKey,
						direction: sortDirection,
					});
				}

				return [{ sortDirection } as Partial<Model<TData, TSortKey> & TModel>, cmd.ofMsg(Msg.refresh())];
			},

			setSorting({ key, direction }) {
				return [
					{ currentSorterKey: key, sortDirection: direction } as Partial<Model<TData, TSortKey> & TModel>,
					cmd.ofMsg(Msg.refresh()),
				];
			},
		},
	};
}

export type { Message, Model, Msg, Options, SortDirection, Sorter, SortFunc } from "./shared";

export { createList };
