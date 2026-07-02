import { execCmd, getUpdateFn } from "react-elmish/immutable/testing";
import type { FilterGroupDefinition, Model as SearchModel } from "../SearchScreen";
import { createSearch } from "./SearchScreen";

type TestModel = SearchModel<string>;

describe("immutable/SearchScreen", () => {
	describe("queryChanged", () => {
		it("updates the query string and refreshes", async () => {
			const searchScreen = createSearch({ filterByQuery: jest.fn() });
			const update = getUpdateFn(searchScreen.updateMap);

			const [model, cmd] = update(searchScreen.Msg.queryChanged("query"), searchScreen.init(), {});
			const messages = await execCmd(cmd);

			expect(model).toStrictEqual<Partial<TestModel>>({ query: "query" });
			expect(messages).toStrictEqual([searchScreen.Msg.refreshSearch()]);
		});
	});

	describe("toggleFilter", () => {
		it("does nothing without filters", () => {
			const searchScreen = createSearch({ filterByQuery: jest.fn() });
			const update = getUpdateFn(searchScreen.updateMap);

			const [model, cmd] = update(
				searchScreen.Msg.toggleFilter({ name: "x", filter: jest.fn(), active: false }),
				searchScreen.init(),
				{},
			);

			expect(model).toStrictEqual<Partial<TestModel>>({});
			expect(cmd).toBeUndefined();
		});

		it("toggles the active state of a filter referenced from the (frozen) model", async () => {
			const filter = jest.fn();
			const filterGroups: FilterGroupDefinition<string>[] = [{ filters: [{ name: "filter1", active: false, filter }] }];
			const searchScreen = createSearch({ filterByQuery: jest.fn(), filterGroups });
			const update = getUpdateFn(searchScreen.updateMap);
			const initialModel = searchScreen.init();

			const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[0]!);
			const [model, cmd] = update(msg, initialModel, {});
			const messages = await execCmd(cmd);

			expect(model).toStrictEqual<Partial<TestModel>>({
				filterGroups: [{ filters: [{ name: "filter1", active: true, filter }] }],
			});
			expect(messages).toStrictEqual([searchScreen.Msg.refreshSearch()]);
		});

		it("disables the other filters in a toggle-mode group", () => {
			const filter1 = jest.fn();
			const filter2 = jest.fn();
			const filter3 = jest.fn();
			const filterGroups: FilterGroupDefinition<string>[] = [
				{
					filters: [
						{ name: "filter1", active: true, filter: filter1 },
						{ name: "filter2", active: false, filter: filter2 },
						{ name: "filter3", active: true, filter: filter3 },
					],
					toggleMode: true,
					noneActiveAllowed: true,
				},
			];
			const searchScreen = createSearch({ filterByQuery: jest.fn(), filterGroups });
			const update = getUpdateFn(searchScreen.updateMap);
			const initialModel = searchScreen.init();

			const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[1]!);
			const [model] = update(msg, initialModel, {});

			expect(model.filterGroups).toStrictEqual([
				{
					filters: [
						{ name: "filter1", active: false, filter: filter1 },
						{ name: "filter2", active: true, filter: filter2 },
						{ name: "filter3", active: false, filter: filter3 },
					],
					toggleMode: true,
					noneActiveAllowed: true,
				},
			]);
		});

		it("re-enables the first filter when none is allowed to be active", () => {
			const filter1 = jest.fn();
			const filter2 = jest.fn();
			const filterGroups: FilterGroupDefinition<string>[] = [
				{
					filters: [
						{ name: "filter1", active: false, filter: filter1 },
						{ name: "filter2", active: true, filter: filter2 },
					],
					noneActiveAllowed: false,
				},
			];
			const searchScreen = createSearch({ filterByQuery: jest.fn(), filterGroups });
			const update = getUpdateFn(searchScreen.updateMap);
			const initialModel = searchScreen.init();

			const msg = searchScreen.Msg.toggleFilter(initialModel.filterGroups![0]!.filters[1]!);
			const [model] = update(msg, initialModel, {});

			expect(model.filterGroups).toStrictEqual([
				{
					filters: [
						{ name: "filter1", active: true, filter: filter1 },
						{ name: "filter2", active: false, filter: filter2 },
					],
					noneActiveAllowed: false,
				},
			]);
		});
	});

	describe("refreshSearch", () => {
		it("filters the items using the query and the active filters", () => {
			const items = ["a", "b", "c", "ab", "bc"];
			const filterFunc = jest.fn((value: string) => value.length > 1);
			const searchFunc = jest.fn((value: string, query: string) => value.includes(query));
			const filterGroups: FilterGroupDefinition<string>[] = [{ filters: [{ name: "long", active: true, filter: filterFunc }] }];
			const searchScreen = createSearch({ filterByQuery: searchFunc, filterGroups });
			const update = getUpdateFn(searchScreen.updateMap);

			const [model, cmd] = update(searchScreen.Msg.refreshSearch(), { ...searchScreen.init(), items, query: "a" }, {});

			expect(model).toStrictEqual<Partial<TestModel>>({ visibleItems: ["ab"] });
			expect(cmd).toBeUndefined();
		});
	});
});
