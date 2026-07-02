import { execCmd, getUpdateFn } from "react-elmish/immutable/testing";
import type { Model, Sorter } from "../ListScreen";
import { createList } from "./ListScreen";

const defaultSorter: Sorter<number>[] = [
	{
		key: "1",
		name: "1",
		sorter: (first, second) => first - second,
	},
	{
		key: "2",
		name: "2",
		sorter: (first, second) => second - first,
	},
];

function createModel<TData>(overrides: Partial<Model<TData>> = {}): Model<TData> {
	return {
		items: [],
		currentSorterKey: null,
		sortDirection: "asc",
		...overrides,
	};
}

describe("immutable/ListScreen", () => {
	describe("init", () => {
		it("initializes with the first sorter key", () => {
			const listScreen = createList({ sorter: defaultSorter });

			const model = listScreen.init();

			expect(model.currentSorterKey).toBe("1");
			expect(model.items).toHaveLength(0);
			expect(model.sortDirection).toBe("asc");
		});

		it("initializes with a null sorter key for a sort function", () => {
			const listScreen = createList({ sorter: jest.fn() });

			const model = listScreen.init();

			expect(model.currentSorterKey).toBeNull();
		});
	});

	describe("dataLoaded", () => {
		it("saves the data and refreshes the list", async () => {
			const items = ["item-1", "item-2", "item-3"];
			const listScreen = createList<unknown, unknown, string>();
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel, cmd] = update(listScreen.Msg.dataLoaded(items), createModel<string>(), {});
			const messages = await execCmd(cmd);

			expect(newModel).toStrictEqual<Partial<Model<string>>>({ items });
			expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
		});
	});

	describe("refresh", () => {
		it("does nothing without a sorter", () => {
			const listScreen = createList();
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel, cmd] = update(listScreen.Msg.refresh(), createModel<number>({ items: [2, 1] }), {});

			expect(newModel).toStrictEqual<Partial<Model<number>>>({});
			expect(cmd).toBeUndefined();
		});

		it("sorts ascending with a sort function", () => {
			const listScreen = createList({ sorter: (first: number, second: number) => first - second });
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel] = update(listScreen.Msg.refresh(), createModel<number>({ items: [2, 1], sortDirection: "asc" }), {});

			expect(newModel).toStrictEqual<Partial<Model<number>>>({ items: [1, 2] });
		});

		it("sorts descending with a sort function", () => {
			const listScreen = createList({ sorter: (first: number, second: number) => first - second });
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel] = update(listScreen.Msg.refresh(), createModel<number>({ items: [1, 2], sortDirection: "desc" }), {});

			expect(newModel).toStrictEqual<Partial<Model<number>>>({ items: [2, 1] });
		});

		it("uses the sorter matching the current sorter key", () => {
			const listScreen = createList({ sorter: defaultSorter });
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel] = update(
				listScreen.Msg.refresh(),
				createModel<number>({ items: [1, 2], currentSorterKey: "2", sortDirection: "asc" }),
				{},
			);

			expect(newModel).toStrictEqual<Partial<Model<number>>>({ items: [2, 1] });
		});
	});

	describe("setSorter", () => {
		it("does nothing for the same key without toggling", () => {
			const listScreen = createList();
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel, cmd] = update(listScreen.Msg.setSorter("1"), createModel<number>({ currentSorterKey: "1" }), {});

			expect(newModel).toStrictEqual<Partial<Model<number>>>({});
			expect(cmd).toBeUndefined();
		});

		it("toggles the direction for the same key when requested", async () => {
			const listScreen = createList();
			const update = getUpdateFn(listScreen.updateMap);

			const [, cmd] = update(listScreen.Msg.setSorter("1", true), createModel<number>({ currentSorterKey: "1" }), {});
			const messages = await execCmd(cmd);

			expect(messages).toStrictEqual([listScreen.Msg.toggleSortDirection()]);
		});

		it("changes the sorter key and calls the callbacks", async () => {
			const onUpdateSorting = jest.fn();
			const onSorterChanged = jest.fn();
			const listScreen = createList({ sorter: defaultSorter, onUpdateSorting, onSorterChanged });
			const update = getUpdateFn(listScreen.updateMap);
			const model = createModel<number>({ currentSorterKey: "1", sortDirection: "asc" });

			const [newModel, cmd] = update(listScreen.Msg.setSorter("2"), model, {});
			const messages = await execCmd(cmd);

			expect(newModel).toStrictEqual<Partial<Model<number>>>({ currentSorterKey: "2" });
			expect(onSorterChanged).toHaveBeenCalledWith(defaultSorter[1], "asc");
			expect(onUpdateSorting).toHaveBeenCalledWith(model, {}, { key: "2", direction: "asc" });
			expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
		});
	});

	describe("setSortDirection", () => {
		it("sets the direction and refreshes", async () => {
			const onUpdateSorting = jest.fn();
			const listScreen = createList({ onUpdateSorting });
			const update = getUpdateFn(listScreen.updateMap);
			const model = createModel<number>({ currentSorterKey: "1" });

			const [newModel, cmd] = update(listScreen.Msg.setSortDirection("desc"), model, {});
			const messages = await execCmd(cmd);

			expect(newModel).toStrictEqual<Partial<Model<number>>>({ sortDirection: "desc" });
			expect(onUpdateSorting).toHaveBeenCalledWith(model, {}, { key: "1", direction: "desc" });
			expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
		});
	});

	describe("toggleSortDirection", () => {
		it("toggles the direction and refreshes", async () => {
			const listScreen = createList();
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel, cmd] = update(listScreen.Msg.toggleSortDirection(), createModel<number>({ sortDirection: "asc" }), {});
			const messages = await execCmd(cmd);

			expect(newModel).toStrictEqual<Partial<Model<number>>>({ sortDirection: "desc" });
			expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
		});
	});

	describe("setSorting", () => {
		it("sets both key and direction and refreshes", async () => {
			const listScreen = createList();
			const update = getUpdateFn(listScreen.updateMap);

			const [newModel, cmd] = update(listScreen.Msg.setSorting("2", "desc"), createModel<number>(), {});
			const messages = await execCmd(cmd);

			expect(newModel).toStrictEqual<Partial<Model<number>>>({ currentSorterKey: "2", sortDirection: "desc" });
			expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
		});
	});
});
