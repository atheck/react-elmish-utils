import { cmd, type UpdateMap } from "react-elmish";

type SortDirection = "asc" | "desc";

/**
 * Model to show a list of items.
 */
interface Model<TData, TSortKey extends string = string> {
	/**
	 * The collection of items.
	 */
	items: TData[];
	/**
	 * The key of the currently active sorter.
	 */
	currentSorterKey: TSortKey | null;
	/**
	 * The current sort direction.
	 */
	sortDirection: SortDirection;
}

type SortFunc<T> = (item1: T, item2: T) => number;

interface Sorter<TData, TSortKey extends string = string> {
	key: TSortKey;
	name: string;
	sorter: SortFunc<TData>;
}

interface Options<TModel, TProps, TData, TSortKey extends string = string> {
	/**
	 * A function to sort the items, or an array of `Sorter` objects.
	 */
	sorter?: SortFunc<TData> | Sorter<TData, TSortKey>[];
	/**
	 * Gets called when the sorting has changed.
	 */
	onUpdateSorting?: (model: TModel, props: TProps, sorting: { key: TSortKey | null; direction: SortDirection }) => void;
	/**
	 * Gets called when the used `Sorter` or the sort direction has changed.
	 */
	onSorterChanged?: (sorter: Sorter<TData, TSortKey>, sortDirection: SortDirection) => void;
}

type Message<TData, TSortKey extends string = string> =
	| { name: "dataLoaded"; data: TData[] }
	| { name: "refresh" }
	| { name: "setSorter"; key: TSortKey; toggleDirection?: boolean }
	| { name: "setSortDirection"; direction: SortDirection }
	| { name: "toggleSortDirection" }
	| { name: "setSorting"; key: TSortKey; direction: SortDirection };

interface Msg<TData, TSortKey extends string = string> {
	/**
	 * Sets the loaded items.
	 * This message must be called after the data has been loaded.
	 * @param data The loaded items.
	 */
	dataLoaded: (data: TData[]) => Message<TData, TSortKey>;
	/**
	 * Refreshes the view.
	 */
	refresh: () => Message<TData, TSortKey>;
	/**
	 * Changes the sorting.
	 * @param key The key of the `Sorter` to use.
	 * @param toggleDirection If `true` it toggles the sort direction if the used `Sorter` stays the same.
	 */
	setSorter: (key: TSortKey, toggleDirection?: boolean) => Message<TData, TSortKey>;
	/**
	 * Sets the sort direction.
	 * @param direction The new sort direction.
	 */
	setSortDirection: (direction: SortDirection) => Message<TData, TSortKey>;
	/**
	 * Toggles the sort direction.
	 */
	toggleSortDirection: () => Message<TData, TSortKey>;
	/**
	 * Sets the `Sorter` with the given key.
	 * @param key The key of the `Sorter` to set.
	 * @param direction The sort direction.
	 */
	setSorting: (key: TSortKey, direction: SortDirection) => Message<TData, TSortKey>;
}

interface List<TModel, TProps, TData, TSortKey extends string = string> {
	Msg: Msg<TData, TSortKey>;
	init: () => Model<TData, TSortKey>;
	updateMap: UpdateMap<TProps, Model<TData, TSortKey> & TModel, Message<TData, TSortKey>>;
}

function createList<TModel, TProps, TData, TSortKey extends string = string>(
	options: Options<TModel, TProps, TData, TSortKey> = {},
): List<TModel, TProps, TData, TSortKey> {
	const Msg: Msg<TData, TSortKey> = {
		dataLoaded: (data: TData[]): Message<TData, TSortKey> => ({ name: "dataLoaded", data }),
		refresh: (): Message<TData, TSortKey> => ({ name: "refresh" }),
		setSorter: (key: TSortKey, toggleDirection?: boolean): Message<TData, TSortKey> => ({
			name: "setSorter",
			key,
			toggleDirection,
		}),
		setSortDirection: (direction: SortDirection): Message<TData, TSortKey> => ({ name: "setSortDirection", direction }),
		toggleSortDirection: (): Message<TData, TSortKey> => ({ name: "toggleSortDirection" }),
		setSorting: (key: TSortKey, direction: SortDirection): Message<TData, TSortKey> => ({ name: "setSorting", key, direction }),
	};

	return {
		Msg,
		init(): Model<TData, TSortKey> {
			let currentSorterKey: TSortKey | null = null;

			if (options.sorter && typeof options.sorter !== "function" && options.sorter[0]) {
				currentSorterKey = options.sorter[0].key;
			}

			return {
				items: [],
				currentSorterKey,
				sortDirection: "asc",
			};
		},
		updateMap: {
			dataLoaded({ data }) {
				return [{ items: data } as Partial<Model<TData, TSortKey> & TModel>, cmd.ofMsg(Msg.refresh())];
			},

			refresh(_msg, model) {
				let currentSorter: SortFunc<TData> | null = null;

				if (model.currentSorterKey && Array.isArray(options.sorter)) {
					currentSorter = options.sorter.find((sorter) => sorter.key === model.currentSorterKey)?.sorter ?? null;
				} else if (typeof options.sorter === "function") {
					currentSorter = options.sorter;
				}

				if (currentSorter) {
					const items =
						model.sortDirection === "asc" ? model.items.sort(currentSorter) : sortDescending(model.items, currentSorter);

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

function getSorterByKey<TData, TSortKey extends string>(
	key: string | null,
	sorters?: SortFunc<TData> | Sorter<TData, TSortKey>[],
): Sorter<TData, TSortKey> | null {
	if (key && Array.isArray(sorters)) {
		return sorters.find((sorter) => key === sorter.key) ?? null;
	}

	return null;
}

function sortDescending<TData>(array: TData[], compareFn?: ((a: TData, b: TData) => number) | undefined): TData[] {
	if (compareFn) {
		return array.sort((data1: TData, data2: TData) => compareFn(data2, data1));
	}

	// eslint-disable-next-line @typescript-eslint/require-array-sort-compare
	return array.sort().reverse();
}

export type { Message, Model, Msg, Options, SortDirection, SortFunc, Sorter };

export { createList };
