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

type SortFunc<TData> = (item1: TData, item2: TData) => number;

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

/**
 * Creates the `Msg` object with the list message creators.
 * @returns The `Msg` object.
 */
function createMsg<TData, TSortKey extends string = string>(): Msg<TData, TSortKey> {
	return {
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
}

/**
 * Creates the initial list model.
 * @param options The list options.
 * @returns The `init` function.
 */
function createInit<TModel, TProps, TData, TSortKey extends string = string>(
	options: Options<TModel, TProps, TData, TSortKey>,
): () => Model<TData, TSortKey> {
	return (): Model<TData, TSortKey> => {
		let currentSorterKey: TSortKey | null = null;

		if (options.sorter && typeof options.sorter !== "function" && options.sorter[0]) {
			currentSorterKey = options.sorter[0].key;
		}

		return {
			items: [],
			currentSorterKey,
			sortDirection: "asc",
		};
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

function sortDescending<TData>(array: TData[], compareFn: (a: TData, b: TData) => number): TData[] {
	return array.toSorted((data1: TData, data2: TData) => compareFn(data2, data1));
}

/**
 * Resolves the currently active sort function for the given model.
 * @param currentSorterKey The key of the current sorter.
 * @param sorter The configured sorter option.
 * @returns The active sort function, or null if there is none.
 */
function getCurrentSorter<TData, TSortKey extends string>(
	currentSorterKey: TSortKey | null,
	sorter?: SortFunc<TData> | Sorter<TData, TSortKey>[],
): SortFunc<TData> | null {
	if (currentSorterKey && Array.isArray(sorter)) {
		return sorter.find((current) => current.key === currentSorterKey)?.sorter ?? null;
	}

	if (typeof sorter === "function") {
		return sorter;
	}

	return null;
}

export type { Message, Model, Msg, Options, SortDirection, Sorter, SortFunc };

export { createInit, createMsg, getCurrentSorter, getSorterByKey, sortDescending };
