/**
 * Definition of a filter.
 */
interface FilterDefinition<TData> {
	/**
	 * The name of the filter.
	 */
	name: string;
	/**
	 * The filter function.
	 */
	filter: (data: TData) => boolean;
	/**
	 * The initial state of the filter.
	 */
	active?: boolean;
}

interface Filter<TData> extends FilterDefinition<TData> {
	active: boolean;
}

type SearchFunc<TData> = (item: TData, query: string) => boolean;

interface SearchOptions<TData> {
	/**
	 * The list of all items.
	 */
	items: TData[];
	/**
	 * The search query string.
	 */
	query: string;
	/**
	 * The optional list of filters.
	 */
	filters?: Filter<TData>[];
	/**
	 * The function to filter one item of the list by the given query string.
	 */
	filterByQuery: SearchFunc<TData>;
}

/**
 * Searches for matching items by a query and filters.
 * @param param0 The options object.
 * @returns The list of items matching the given search query and active filters.
 */
function search<TData>({ query, items, filters, filterByQuery }: SearchOptions<TData>): TData[] {
	if (areQueryAndFiltersEmpty(query, filters)) {
		return [];
	}

	const queryLowerCase = query.toLowerCase();
	const filtered = filterItems(items, filters);
	const visibleItems = queryLowerCase.length > 0 ? filtered.filter((i) => filterByQuery(i, queryLowerCase)) : filtered;

	return visibleItems;
}

function filterItems<TData>(items: TData[], filters?: Filter<TData>[]): TData[] {
	if (!filters || filters.every((filter) => !filter.active)) {
		return items;
	}

	const activeFilters = filters.filter((filter) => filter.active);

	return items.filter((i) => {
		for (const filter of activeFilters) {
			if (filter.filter(i)) {
				return true;
			}
		}

		return false;
	});
}

function areQueryAndFiltersEmpty<TData>(query: string, filters?: Filter<TData>[]): boolean {
	return query.length === 0 && (!filters || filters.every((current) => !current.active));
}

export type { Filter, FilterDefinition, SearchFunc };

export { search };
