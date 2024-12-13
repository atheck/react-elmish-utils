interface FilterGroupDefinition<TData> {
	/**
	 * The filters in this group.
	 */
	filters: FilterDefinition<TData>[];
	/**
	 * If set to true, only one filter can be active at a time.
	 */
	toggleMode?: boolean;
	/**
	 * If set to true, it is allowed to have no filter active.
	 */
	noneActiveAllowed?: boolean;
}

interface FilterGroup<TData> {
	/**
	 * The filters in this group.
	 */
	filters: Filter<TData>[];
	/**
	 * If set to true, only one filter can be active at a time.
	 */
	toggleMode?: boolean;
	/**
	 * If set to true, it is allowed to have no filter active.
	 */
	noneActiveAllowed?: boolean;
}

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
	filterGroups?: FilterGroupDefinition<TData>[];
	/**
	 * The function to filter one item of the list by the given query string.
	 */
	filterByQuery: SearchFunc<TData>;
	/**
	 * If set to true, all items are shown if the query is empty and no filters are set.
	 */
	showAllItemsByDefault: boolean;
}

/**
 * Searches for matching items by a query and filters.
 * @param param0 The options object.
 * @returns The list of items matching the given search query and active filters.
 */
function search<TData>({ query, items, filterGroups, filterByQuery, showAllItemsByDefault }: SearchOptions<TData>): TData[] {
	if (!showAllItemsByDefault && areQueryAndFiltersEmpty(query, filterGroups)) {
		return [];
	}

	const queryLowerCase = query.toLowerCase();
	const filtered = filterItems(items, filterGroups);
	const visibleItems = queryLowerCase.length > 0 ? filtered.filter((i) => filterByQuery(i, queryLowerCase)) : filtered;

	return visibleItems;
}

function filterItems<TData>(items: TData[], filterGroups?: FilterGroupDefinition<TData>[]): TData[] {
	const activeGroups = getActiveFilterGroups(filterGroups);

	if (activeGroups.length === 0) {
		return items;
	}

	return items.filter((item) =>
		activeGroups.every((group) => group.filters.some((filter) => filter.active && filter.filter(item))),
	);
}

function areQueryAndFiltersEmpty<TData>(query: string, filterGroups?: FilterGroupDefinition<TData>[]): boolean {
	return query.length === 0 && getActiveFilterGroups(filterGroups).length === 0;
}

function getActiveFilterGroups<TData>(filterGroups?: FilterGroupDefinition<TData>[]): FilterGroupDefinition<TData>[] {
	return filterGroups?.filter((group) => group.filters.some((filter) => filter.active)) ?? [];
}

export type { Filter, FilterDefinition, FilterGroup, FilterGroupDefinition, SearchFunc };

export { search };
