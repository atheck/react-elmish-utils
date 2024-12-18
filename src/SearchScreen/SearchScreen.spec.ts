import { execCmd, getUpdateFn } from "react-elmish/dist/Testing";
import { type Filter, type FilterDefinition, type FilterGroupDefinition, type Model as SearchModel, createSearch } from ".";

type TestModel = SearchModel<string>;

describe("SearchScreen", () => {
	describe("init", () => {
		it("correctly initializes the model", () => {
			// arrange
			const mockFilterFunc = jest.fn();
			const mockFilterFn = jest.fn();
			const filterGroups: FilterGroupDefinition<string>[] = [
				{
					filters: [
						{
							name: "filter1",
							active: true,
							filter: mockFilterFn,
						},
						{ name: "filter2", filter: mockFilterFn },
					],
				},
				{
					filters: [
						{
							name: "filter3",
							filter: mockFilterFn,
						},
					],
				},
			];

			const searchScreen = createSearch({
				filterByQuery: mockFilterFunc,
				filterGroups,
			});

			// act
			const model = searchScreen.init();

			// assert
			expect(model.filterGroups).toStrictEqual([
				{
					filters: [
						{
							name: "filter1",
							filter: mockFilterFn,
							active: true,
						},
						{ name: "filter2", filter: mockFilterFn, active: false },
					],
				},
				{
					filters: [
						{
							name: "filter3",
							filter: mockFilterFn,
							active: false,
						},
					],
				},
			]);
			expect(model.query).toBe("");
			expect(model.visibleItems).toHaveLength(0);
		});
	});

	describe("update", () => {
		describe("queryChanged", () => {
			it("updates the query string", async () => {
				// arrange
				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
				});
				const query = "query";
				const msg = searchScreen.Msg.queryChanged(query);
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [model, cmd] = update(msg, searchScreen.init(), {});
				const messages = await execCmd(cmd);

				// assert
				expect(model).toStrictEqual<Partial<TestModel>>({ query });
				expect(messages).toStrictEqual([searchScreen.Msg.refreshSearch()]);
			});
		});

		describe("toggleFilter", () => {
			it("does nothing without filters", () => {
				// arrange
				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
				});
				const msg = searchScreen.Msg.toggleFilter(createFilter());
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [model, cmd] = update(msg, searchScreen.init(), {});

				// assert
				expect(model).toStrictEqual<Partial<TestModel>>({});
				expect(cmd).toBeUndefined();
			});

			it("toggles the filter active state and refreshes the list", async () => {
				// arrange
				const filter = createFilter({ active: false });
				const filterGroups = [createFilterGroupDefinition({ filters: [filter] })];
				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
					filterGroups,
				});

				const initialModel = searchScreen.init();

				const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[0]!);
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [model, cmd] = update(msg, initialModel, {});
				const messages = await execCmd(cmd);

				// assert
				expect(model).toStrictEqual<Partial<TestModel>>({ filterGroups: [{ filters: [{ ...filter, active: true }] }] });
				expect(messages).toStrictEqual([searchScreen.Msg.refreshSearch()]);
			});

			it("disables all other filter of a single group when a filter is activated", () => {
				// arrange
				const mockFilter1 = jest.fn();
				const mockFilter2 = jest.fn();
				const mockFilter3 = jest.fn();
				const mockFilter4 = jest.fn();
				const filterGroups: FilterGroupDefinition<string>[] = [
					{
						filters: [
							{ name: "filter1", active: true, filter: mockFilter1 },
							{ name: "filter2", active: false, filter: mockFilter2 },
							{ name: "filter3", active: true, filter: mockFilter3 },
						],
						toggleMode: true,
						noneActiveAllowed: true,
					},
					{
						filters: [{ name: "filter4", active: true, filter: mockFilter4 }],
					},
				];

				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
					filterGroups,
				});

				const initialModel = searchScreen.init();

				const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[1]!);
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [model] = update(msg, initialModel, {});

				// assert
				expect(model.filterGroups).toStrictEqual([
					{
						filters: [
							{ name: "filter1", active: false, filter: mockFilter1 },
							{ name: "filter2", active: true, filter: mockFilter2 },
							{ name: "filter3", active: false, filter: mockFilter3 },
						],
						toggleMode: true,
						noneActiveAllowed: true,
					},
					{
						filters: [{ name: "filter4", active: true, filter: mockFilter4 }],
					},
				]);
			});

			it("doesn't change other filters of a single group when a filter is deactivated", () => {
				// arrange
				const mockFilter1 = jest.fn();
				const mockFilter2 = jest.fn();
				const mockFilter3 = jest.fn();
				const mockFilter4 = jest.fn();
				const filterGroups: FilterGroupDefinition<string>[] = [
					{
						filters: [
							{ name: "filter1", active: true, filter: mockFilter1 },
							{ name: "filter2", active: true, filter: mockFilter2 },
							{ name: "filter3", active: false, filter: mockFilter3 },
						],
						toggleMode: true,
						noneActiveAllowed: true,
					},
					{
						filters: [{ name: "filter4", filter: mockFilter4 }],
					},
				];

				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
					filterGroups,
				});

				const initialModel = searchScreen.init();

				const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[1]!);
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [model] = update(msg, initialModel, {});

				// assert
				expect(model.filterGroups).toStrictEqual([
					{
						filters: [
							{ name: "filter1", active: true, filter: mockFilter1 },
							{ name: "filter2", active: false, filter: mockFilter2 },
							{ name: "filter3", active: false, filter: mockFilter3 },
						],
						toggleMode: true,
						noneActiveAllowed: true,
					},
					{
						filters: [{ name: "filter4", active: false, filter: mockFilter4 }],
					},
				]);
			});

			it("enables the first filter of a group where none is disallowed and no filter is active", () => {
				// arrange
				const mockFilter1 = jest.fn();
				const mockFilter2 = jest.fn();
				const mockFilter3 = jest.fn();
				const mockFilter4 = jest.fn();
				const filterGroups: FilterGroupDefinition<string>[] = [
					{
						filters: [
							{ name: "filter1", active: false, filter: mockFilter1 },
							{ name: "filter2", active: true, filter: mockFilter2 },
							{ name: "filter3", active: false, filter: mockFilter3 },
						],
						toggleMode: false,
						noneActiveAllowed: false,
					},
					{
						filters: [{ name: "filter4", active: true, filter: mockFilter4 }],
					},
				];

				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
					filterGroups,
				});

				const initialModel = searchScreen.init();

				const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[1]!);
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [model] = update(msg, initialModel, {});

				// assert
				expect(model.filterGroups).toStrictEqual([
					{
						filters: [
							{ name: "filter1", active: true, filter: mockFilter1 },
							{ name: "filter2", active: false, filter: mockFilter2 },
							{ name: "filter3", active: false, filter: mockFilter3 },
						],
						toggleMode: false,
						noneActiveAllowed: false,
					},
					{
						filters: [{ name: "filter4", active: true, filter: mockFilter4 }],
					},
				]);
			});

			it("doesn't change other filters of a group where none is disallowed and a filter is active", () => {
				// arrange
				const mockFilter1 = jest.fn();
				const mockFilter2 = jest.fn();
				const mockFilter3 = jest.fn();
				const mockFilter4 = jest.fn();
				const filterGroups: FilterGroupDefinition<string>[] = [
					{
						filters: [
							{ name: "filter1", active: false, filter: mockFilter1 },
							{ name: "filter2", active: true, filter: mockFilter2 },
							{ name: "filter3", active: true, filter: mockFilter3 },
						],
						toggleMode: false,
						noneActiveAllowed: false,
					},
					{
						filters: [{ name: "filter4", active: false, filter: mockFilter4 }],
					},
				];

				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
					filterGroups,
				});

				const initialModel = searchScreen.init();

				const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[1]!);
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [model] = update(msg, initialModel, {});

				// assert
				expect(model.filterGroups).toStrictEqual([
					{
						filters: [
							{ name: "filter1", active: false, filter: mockFilter1 },
							{ name: "filter2", active: false, filter: mockFilter2 },
							{ name: "filter3", active: true, filter: mockFilter3 },
						],
						toggleMode: false,
						noneActiveAllowed: false,
					},
					{
						filters: [{ name: "filter4", active: false, filter: mockFilter4 }],
					},
				]);
			});
		});

		describe("refreshSearch", () => {
			it("filters the items correctly", () => {
				// arrange
				const items = ["a", "b", "c", "ab", "bc"];

				// ["ab", "bc"]
				const mockFilterFunc = jest.fn((value: string) => value.length > 1);
				const mockFilter = createFilter({
					active: true,
					filter: mockFilterFunc,
				});
				const filterGroups = [createFilterGroupDefinition({ filters: [mockFilter] })];

				// ["ab"]
				const mockSearchFunc = jest.fn((value: string, query: string) => value.includes(query));

				const searchScreen = createSearch({
					filterByQuery: mockSearchFunc,
					filterGroups,
				});

				const msg = searchScreen.Msg.refreshSearch();
				const update = getUpdateFn(searchScreen.updateMap);

				const expectedVisibleItems = ["ab"];

				// act
				const [model, cmd] = update(msg, mockModel(searchScreen.init(), { items, query: "A" }), {});

				// assert
				expect(mockFilterFunc).toHaveBeenCalledTimes(5);
				expect(mockFilterFunc).toHaveBeenLastCalledWith("bc");
				expect(mockSearchFunc).toHaveBeenCalledTimes(2);
				expect(mockSearchFunc).toHaveBeenLastCalledWith("bc", "a");
				expect(model).toStrictEqual<Partial<TestModel>>({ visibleItems: expectedVisibleItems });
				expect(cmd).toBeUndefined();
			});
		});
	});
});

function mockModel(initialModel: TestModel, template?: Partial<TestModel>): TestModel {
	return {
		...initialModel,
		...template,
	};
}

function createFilterDefinition(template?: Partial<FilterDefinition<string>>): FilterDefinition<string> {
	return {
		name: "Test",
		filter: jest.fn(),
		active: false,
		...template,
	};
}

function createFilterGroupDefinition(template?: Partial<FilterGroupDefinition<string>>): FilterGroupDefinition<string> {
	return {
		filters: [createFilterDefinition()],
		...template,
	};
}

function createFilter(template?: Partial<Filter<string>>): Filter<string> {
	return {
		name: "Test",
		filter: jest.fn(),
		active: false,
		...template,
	};
}
