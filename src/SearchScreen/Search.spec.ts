import { search, type Filter } from "./Search";

describe("search", () => {
	it("returns an empty array if search string is empty", () => {
		// arrange
		const items = [1, 2, 3, 4, 5];

		// act
		const result = search({ query: "", items, filterByQuery: () => true });

		// assert
		expect(result).toHaveLength(0);
	});

	it("returns correct result if search string is empty and filters are active", () => {
		// arrange
		const items = [1, 2, 3, 4, 5];
		const filters: Filter<number>[] = [{ name: "bigger than 3", active: true, filter: (value) => value > 3 }];

		// act
		const result = search({ query: "", items, filters, filterByQuery: () => true });

		// assert
		expect(result).toStrictEqual([4, 5]);
	});

	it("returns an empty array if search string is empty and no filters are active", () => {
		// arrange
		const items = [1, 2, 3, 4, 5];
		const filters: Filter<number>[] = [{ name: "bigger than 3", active: false, filter: (value) => value > 3 }];

		// act
		const result = search({ query: "", items, filters, filterByQuery: () => true });

		// assert
		expect(result).toHaveLength(0);
	});

	it("returns correct result if search string is not empty and filters are active", () => {
		// arrange
		const items = ["Berlin", "London", "Paris", "Prag", "Tsipras"];
		const filters: Filter<string>[] = [{ name: "starts with P", active: true, filter: (value) => value.startsWith("P") }];

		// act
		const result = search({ query: "pr", items, filters, filterByQuery: (item, query) => item.toLowerCase().includes(query) });

		// assert
		expect(result).toStrictEqual(["Prag"]);
	});

	it("returns correct result if search string is not empty and no filters are active", () => {
		// arrange
		const items = ["Berlin", "London", "Paris", "Prag", "Tsipras"];
		const filters: Filter<string>[] = [{ name: "starts with P", active: false, filter: (value) => value.startsWith("P") }];

		// act
		const result = search({ query: "pr", items, filters, filterByQuery: (item, query) => item.toLowerCase().includes(query) });

		// assert
		expect(result).toStrictEqual(["Prag", "Tsipras"]);
	});
});
