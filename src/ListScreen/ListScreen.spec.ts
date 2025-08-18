import { execCmd, getUpdateFn } from "react-elmish/testing";
import { Mock } from "typemoq";
import { createList, type Model, type Sorter } from ".";

const defaultSorter: Sorter<number>[] = [
	{
		key: "1",
		name: "1",
		sorter: jest.fn((first, second) => first - second),
	},
	{
		key: "2",
		name: "2",
		sorter: jest.fn((first, second) => second - first),
	},
];

describe("ListScreen", () => {
	describe("init", () => {
		it("correctly initializes the model with a sorter", () => {
			// arrange
			const sorter: Sorter<number> = {
				key: "sort-key",
				name: "sort-name",
				sorter: jest.fn(),
			};

			const listScreen = createList({
				sorter: [sorter],
			});

			// act
			const model = listScreen.init();

			// assert
			expect(model.currentSorterKey).toStrictEqual(sorter.key);
			expect(model.items).toHaveLength(0);
			expect(model.sortDirection).toBe("asc");
		});

		it("correctly initializes the model with a sort function", () => {
			// arrange
			const sorter = jest.fn();
			const listScreen = createList({
				sorter,
			});

			// act
			const model = listScreen.init();

			// assert
			expect(model.currentSorterKey).toBeNull();
			expect(model.items).toHaveLength(0);
			expect(model.sortDirection).toBe("asc");
		});
	});

	describe("update", () => {
		describe("DataLoaded", () => {
			it("saves the data and refreshes the list", async () => {
				// arrange
				const mockModel = Mock.ofType<Model<string | number>>();
				const items = ["item-1", "item-2", "item-3"];
				const listScreen = createList();
				const msg = listScreen.Msg.dataLoaded(items);
				const update = getUpdateFn(listScreen.updateMap);

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<Model<string | number>>>({ items });
				expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
			});
		});

		describe("Refresh", () => {
			const sortFunc = jest.fn((first, second) => first - second);

			afterEach(() => sortFunc.mockClear());

			it("does nothing without a sorter", () => {
				// arrange
				const mockModel = Mock.ofType<Model<unknown>>();
				const listScreen = createList();
				const msg = listScreen.Msg.refresh();
				const update = getUpdateFn(listScreen.updateMap);

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(newModel).toStrictEqual<Partial<Model<unknown>>>({});
				expect(cmd).toBeUndefined();
			});

			it("sorts the items with the sort function in ascending order", () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList({
					sorter: sortFunc,
				});
				const msg = listScreen.Msg.refresh();
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.items).returns(() => [2, 1]);
				mockModel.setup((model) => model.sortDirection).returns(() => "asc");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ items: [1, 2] });
				expect(cmd).toBeUndefined();
				expect(sortFunc).toHaveBeenCalledWith(expect.anything(), expect.anything());
			});

			it("sorts the items with the sort function in descending order", () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList({
					sorter: sortFunc,
				});
				const msg = listScreen.Msg.refresh();
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.items).returns(() => [2, 1]);
				mockModel.setup((model) => model.sortDirection).returns(() => "desc");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ items: [2, 1] });
				expect(cmd).toBeUndefined();
				expect(sortFunc).toHaveBeenCalledWith(expect.anything(), expect.anything());
			});

			it("does nothing when sorterKey is not found in sorters", () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList({
					sorter: defaultSorter,
				});
				const msg = listScreen.Msg.refresh();
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "invalid");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({});
				expect(cmd).toBeUndefined();
			});

			it("sorts the items with the correct sorter", () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList({
					sorter: defaultSorter,
				});
				const msg = listScreen.Msg.refresh();
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.items).returns(() => [2, 1]);
				mockModel.setup((model) => model.currentSorterKey).returns(() => "2");
				mockModel.setup((model) => model.sortDirection).returns(() => "asc");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ items: [2, 1] });
				expect(cmd).toBeUndefined();
				expect(defaultSorter[1]?.sorter).toHaveBeenCalledWith(1, 2);
			});
		});

		describe("SetSorter", () => {
			it("does nothing with same sorterKey and without toggling direction", () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList();
				const msg = listScreen.Msg.setSorter("1");
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "1");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({});
				expect(cmd).toBeUndefined();
			});

			it("toggles direction with same sorterKey and with toggling direction", async () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList();
				const msg = listScreen.Msg.setSorter("1", true);
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "1");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({});
				expect(messages).toStrictEqual([listScreen.Msg.toggleSortDirection()]);
			});

			it("calls updateSorting", async () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const mockUpdateSorting = jest.fn();
				const listScreen = createList({
					onUpdateSorting: mockUpdateSorting,
				});
				const msg = listScreen.Msg.setSorter("2");
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "1");
				mockModel.setup((model) => model.sortDirection).returns(() => "asc");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(mockUpdateSorting).toHaveBeenCalledTimes(1);
				expect(mockUpdateSorting).toHaveBeenCalledWith(mockModel.object, {}, { key: "2", direction: "asc" });
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ currentSorterKey: "2" });
				expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
			});

			it("calls onSorterChanged callback", async () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const mockOnSorterChanged = jest.fn();
				const listScreen = createList({
					sorter: defaultSorter,
					onSorterChanged: mockOnSorterChanged,
				});
				const msg = listScreen.Msg.setSorter("2");
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "1");
				mockModel.setup((model) => model.sortDirection).returns(() => "asc");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(mockOnSorterChanged).toHaveBeenCalledWith(defaultSorter[1], "asc");
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ currentSorterKey: "2" });
				expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
			});
		});

		describe("SetSortDirection", () => {
			it("calls updateSorting", async () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const mockUpdateSorting = jest.fn();
				const listScreen = createList({
					onUpdateSorting: mockUpdateSorting,
				});
				const msg = listScreen.Msg.setSortDirection("desc");
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "1");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(mockUpdateSorting).toHaveBeenCalledTimes(1);
				expect(mockUpdateSorting).toHaveBeenCalledWith(mockModel.object, {}, { key: "1", direction: "desc" });
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ sortDirection: "desc" });
				expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
			});
		});

		describe("ToggleSortDirection", () => {
			it("toggles direction", async () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList();
				const msg = listScreen.Msg.toggleSortDirection();
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.sortDirection).returns(() => "asc");

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ sortDirection: "desc" });
				expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
			});

			it("calls updateSorting", () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const mockUpdateSorting = jest.fn();
				const listScreen = createList({
					onUpdateSorting: mockUpdateSorting,
				});
				const msg = listScreen.Msg.toggleSortDirection();
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "1");
				mockModel.setup((model) => model.sortDirection).returns(() => "asc");

				// act
				update(msg, mockModel.object, {});

				// assert
				expect(mockUpdateSorting).toHaveBeenCalledTimes(1);
				expect(mockUpdateSorting).toHaveBeenCalledWith(mockModel.object, {}, { key: "1", direction: "desc" });
			});

			it("calls onSorterChanged callback", () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const mockOnSorterChanged = jest.fn();
				const listScreen = createList({
					sorter: defaultSorter,
					onSorterChanged: mockOnSorterChanged,
				});
				const msg = listScreen.Msg.toggleSortDirection();
				const update = getUpdateFn(listScreen.updateMap);

				mockModel.setup((model) => model.currentSorterKey).returns(() => "1");
				mockModel.setup((model) => model.sortDirection).returns(() => "asc");

				// act
				update(msg, mockModel.object, {});

				// assert
				expect(mockOnSorterChanged).toHaveBeenCalledWith(defaultSorter[0], "desc");
			});
		});

		describe("SetSorting", () => {
			it("returns correct values", async () => {
				// arrange
				const mockModel = Mock.ofType<Model<number>>();
				const listScreen = createList();
				const msg = listScreen.Msg.setSorting("2", "desc");
				const update = getUpdateFn(listScreen.updateMap);

				// act
				const [newModel, cmd] = update(msg, mockModel.object, {});
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<Model<number>>>({ currentSorterKey: "2", sortDirection: "desc" });
				expect(messages).toStrictEqual([listScreen.Msg.refresh()]);
			});
		});
	});
});
