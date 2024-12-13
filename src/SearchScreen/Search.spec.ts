import { type FilterGroupDefinition, search } from "./Search";

describe("search", () => {
	it("returns an empty array if search string is empty, without filters, and not all items should be returned", () => {
		// arrange
		const items = [1, 2, 3, 4, 5];

		// act
		const result = search({ query: "", items, filterByQuery: () => true, showAllItemsByDefault: false });

		// assert
		expect(result).toHaveLength(0);
	});

	it("returns all items if search string is empty, without filters, and all items should be returned", () => {
		// arrange
		const items = [1, 2, 3, 4, 5];

		// act
		const result = search({ query: "", items, filterByQuery: () => true, showAllItemsByDefault: true });

		// assert
		expect(result).toStrictEqual(items);
	});

	it("returns an empty array if search string is empty and no filters are active and not all items should be returned", () => {
		// arrange
		const items = [1, 2, 3, 4, 5];
		const filterGroups: FilterGroupDefinition<number>[] = [
			{ filters: [{ name: "bigger than 3", active: false, filter: (value) => value > 3 }] },
		];

		// act
		const result = search({ query: "", items, filterGroups, filterByQuery: () => true, showAllItemsByDefault: false });

		// assert
		expect(result).toHaveLength(0);
	});

	it("returns all items if search string is empty and no filters are active and all items should be returned", () => {
		// arrange
		const items = [1, 2, 3, 4, 5];
		const filterGroups: FilterGroupDefinition<number>[] = [
			{ filters: [{ name: "bigger than 3", active: false, filter: (value) => value > 3 }] },
		];

		// act
		const result = search({ query: "", items, filterGroups, filterByQuery: () => true, showAllItemsByDefault: true });

		// assert
		expect(result).toStrictEqual(items);
	});

	describe.each([true, false])("showAllItemsByDefault is %s", (showAllItemsByDefault) => {
		it("returns correct result if search string is empty and filters are active", () => {
			// arrange
			const items = [1, 2, 3, 4, 5];
			const filterGroups: FilterGroupDefinition<number>[] = [
				{ filters: [{ name: "bigger than 3", active: true, filter: (value) => value > 3 }] },
			];

			// act
			const result = search({ query: "", items, filterGroups, filterByQuery: () => true, showAllItemsByDefault });

			// assert
			expect(result).toStrictEqual([4, 5]);
		});

		it("returns correct result if search string is not empty and filters are active", () => {
			// arrange
			const items = ["Berlin", "London", "Paris", "Prag", "Tsipras"];
			const filterGroups: FilterGroupDefinition<string>[] = [
				{ filters: [{ name: "starts with P", active: true, filter: (value) => value.startsWith("P") }] },
			];

			// act
			const result = search({
				query: "pr",
				items,
				filterGroups,
				filterByQuery: (item, query) => item.toLowerCase().includes(query),
				showAllItemsByDefault,
			});

			// assert
			expect(result).toStrictEqual(["Prag"]);
		});

		it("returns correct result if multiple filters from the same group are active", () => {
			// arrange
			const items = ["Berlin", "London", "Paris", "Prag", "Tsipras"];
			const filterGroups: FilterGroupDefinition<string>[] = [
				{
					filters: [
						{ name: "Shorter than 6", active: true, filter: (value) => value.length < 6 },
						{ name: "Includes n", active: true, filter: (value) => value.includes("n") },
					],
				},
			];

			// act
			const result = search({
				query: "",
				items,
				filterGroups,
				filterByQuery: (item, query) => item.toLowerCase().includes(query),
				showAllItemsByDefault,
			});

			// assert
			expect(result).toStrictEqual(["Berlin", "London", "Paris", "Prag"]);
		});

		it("returns correct result if multiple filters from different groups are active", () => {
			// arrange
			const items = ["Berlin", "London", "Paris", "Prag", "Tsipras"];
			const filterGroups: FilterGroupDefinition<string>[] = [
				{ filters: [{ name: "Longer than 4", active: true, filter: (value) => value.length >= 4 }] },
				{ filters: [{ name: "Includes n", active: true, filter: (value) => value.includes("n") }] },
			];

			// act
			const result = search({
				query: "",
				items,
				filterGroups,
				filterByQuery: (item, query) => item.toLowerCase().includes(query),
				showAllItemsByDefault,
			});

			// assert
			expect(result).toStrictEqual(["Berlin", "London"]);
		});

		it("returns correct result if search string is not empty and no filters are active", () => {
			// arrange
			const items = ["Berlin", "London", "Paris", "Prag", "Tsipras"];
			const filterGroups: FilterGroupDefinition<string>[] = [
				{ filters: [{ name: "starts with P", active: false, filter: (value) => value.startsWith("P") }] },
			];

			// act
			const result = search({
				query: "pr",
				items,
				filterGroups,
				filterByQuery: (item, query) => item.toLowerCase().includes(query),
				showAllItemsByDefault,
			});

			// assert
			expect(result).toStrictEqual(["Prag", "Tsipras"]);
		});
	});
});
