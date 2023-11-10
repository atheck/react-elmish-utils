import { execCmd, getUpdateFn } from "react-elmish/dist/Testing";
import * as TypeMoq from "typemoq";
import { Filter, FilterDefinition, Model as SearchModel, createSearch } from ".";

type TestModel = SearchModel<string>;

describe("SearchScreen", () => {
	describe("init", () => {
		it("correctly initializes the model", () => {
			// arrange
			const mockFilterFunc = jest.fn();
			const mockFilterFn = jest.fn();
			const filters: FilterDefinition<string>[] = [
				{
					name: "Test",
					filter: mockFilterFn,
				},
			];

			const searchScreen = createSearch({
				filterByQuery: mockFilterFunc,
				filters,
			});

			// act
			const model = searchScreen.init();

			// assert
			expect(model.filters).toStrictEqual([
				{
					name: "Test",
					active: false,
					filter: mockFilterFn,
				},
			]);
			expect(model.query).toBe("");
			expect(model.visibleItems).toHaveLength(0);
		});

		it("correctly initializes the model with a initially active filter", () => {
			// arrange
			const mockFilterFn = jest.fn();
			const filters: FilterDefinition<string>[] = [
				{
					name: "Test",
					filter: mockFilterFn,
					active: true,
				},
			];

			const searchScreen = createSearch({
				filterByQuery: jest.fn(),
				filters,
			});

			// act
			const model = searchScreen.init();

			// assert
			expect(model.filters).toStrictEqual([
				{
					name: "Test",
					active: true,
					filter: mockFilterFn,
				},
			]);
		});
	});

	describe("update", () => {
		describe("queryChanged", () => {
			it("updates the query string", async () => {
				// arrange
				const mockModel = TypeMoq.Mock.ofType<TestModel>();
				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
				});
				const query = "query";
				const msg = searchScreen.Msg.queryChanged(query);
				const update = getUpdateFn(searchScreen.updateMap);

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<TestModel>>({ query });
				expect(messages).toStrictEqual([searchScreen.Msg.refreshSearch()]);
			});
		});

		describe("toggleFilter", () => {
			it("does nothing without filters", () => {
				// arrange
				const mockModel = TypeMoq.Mock.ofType<TestModel>();
				const mockFilter = TypeMoq.Mock.ofType<Filter<string>>();
				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
				});
				const msg = searchScreen.Msg.toggleFilter(mockFilter.object);
				const update = getUpdateFn(searchScreen.updateMap);

				// eslint-disable-next-line unicorn/no-useless-undefined
				mockModel.setup((model) => model.filters).returns(() => undefined);

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(newModel).toStrictEqual<Partial<TestModel>>({});
				expect(cmd).toBeUndefined();
			});

			it("updates the filter and refreshes the list", async () => {
				// arrange
				const mockModel = TypeMoq.Mock.ofType<TestModel>();
				const mockFilter = TypeMoq.Mock.ofType<Filter<string>>();
				const filters: Filter<string>[] = [mockFilter.object];
				const searchScreen = createSearch({
					filterByQuery: jest.fn(),
					filters,
				});
				const msg = searchScreen.Msg.toggleFilter(mockFilter.object);
				const update = getUpdateFn(searchScreen.updateMap);

				mockFilter.setup((filter) => filter.active).returns(() => false);
				mockModel.setup((model) => model.filters).returns(() => filters);

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<TestModel>>({ filters: [{ ...mockFilter.object, active: true }] });
				expect(messages).toStrictEqual([searchScreen.Msg.refreshSearch()]);
			});
		});

		describe("refreshSearch", () => {
			it("filters the items correctly", () => {
				// arrange
				const mockModel = TypeMoq.Mock.ofType<TestModel>();
				const items = ["a", "b", "c", "ab", "bc"];

				const mockFilter = TypeMoq.Mock.ofType<Filter<string>>();
				// ["ab", "bc"]
				const mockFilterFunc = jest.fn((value: string) => value.length > 1);
				const filters: Filter<string>[] = [mockFilter.object];

				// ["ab"]
				const mockSearchFunc = jest.fn((value: string, query: string) => value.includes(query));

				const searchScreen = createSearch({
					filterByQuery: mockSearchFunc,
					filters,
				});

				const msg = searchScreen.Msg.refreshSearch();
				const update = getUpdateFn(searchScreen.updateMap);

				mockFilter.setup((filter) => filter.active).returns(() => true);
				mockFilter.setup((filter) => filter.filter).returns(() => mockFilterFunc);

				mockModel.setup((model) => model.items).returns(() => items);
				mockModel.setup((model) => model.query).returns(() => "A");
				mockModel.setup((model) => model.filters).returns(() => filters);

				const expectedVisibleItems = ["ab"];

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(mockFilterFunc).toHaveBeenCalledTimes(5);
				expect(mockFilterFunc).toHaveBeenLastCalledWith("bc");
				expect(mockSearchFunc).toHaveBeenCalledTimes(2);
				expect(mockSearchFunc).toHaveBeenLastCalledWith("bc", "a");
				expect(newModel).toStrictEqual<Partial<TestModel>>({ visibleItems: expectedVisibleItems });
				expect(cmd).toBeUndefined();
			});
		});
	});
});
