import { getUpdateAndExecCmdFn, getUpdateFn } from "react-elmish/dist/Testing";
import type { Model } from "../Form";
import { type FormMap, createFormMap } from "./FormMap";

interface TestFormValues {
	value1: string;
	value2: number;
}

interface TestModel extends Model<TestFormValues> {}

interface TestProps {}

function initValues(): TestFormValues {
	return {
		value1: "Test",
		value2: 1,
	};
}

describe("FormMap", () => {
	let formMap: FormMap<TestModel, TestProps, TestFormValues>;

	beforeEach(() => {
		formMap = createFormMap({
			initValues,
		});
	});

	describe("init", () => {
		it("returns correct values", () => {
			// act
			const model = formMap.init({});

			// assert
			expect(model).toStrictEqual<TestModel>({
				values: {
					value1: "Test",
					value2: 1,
				},
				errors: [],
				validated: false,
			});
		});
	});

	describe("update", () => {
		const props = createProps();

		describe("valueChanged", () => {
			it("merges values and re-validates", async () => {
				// arrange
				const model = createModel({
					values: {
						value1: "Test",
						value2: 1,
					},
				});
				const msg = formMap.Msg.valueChanged({ value1: "Modified" });
				const update = getUpdateAndExecCmdFn(formMap.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual<Partial<TestModel>>({
					values: {
						value1: "Modified",
						value2: 1,
					},
				});
				expect(messages).toStrictEqual([formMap.Msg.reValidate()]);
			});

			it("calls onValueChanged if provided and takes the returned values", async () => {
				// arrange
				const model = createModel({
					values: {
						value1: "Test",
						value2: 1,
					},
				});
				const onValueChanged = (value: Partial<TestFormValues>): Partial<TestFormValues> => ({
					value1: value.value1,
					value2: 2,
				});
				const formMapWithOnValueChanged = createFormMap({
					initValues,
					onValueChanged,
				});
				const msg = formMapWithOnValueChanged.Msg.valueChanged({ value1: "Modified" });
				const update = getUpdateAndExecCmdFn(formMapWithOnValueChanged.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual<Partial<TestModel>>({
					values: {
						value1: "Modified",
						value2: 2,
					},
				});
				expect(messages).toStrictEqual([formMap.Msg.reValidate()]);
			});
		});

		describe("acceptRequest", () => {
			it("calls validation", async () => {
				// arrange
				const model = createModel({ validated: false });
				const msg = formMap.Msg.acceptRequest();
				const update = getUpdateAndExecCmdFn(formMap.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([formMap.Msg.validate(formMap.Msg.accept())]);
			});
		});

		describe("accept", () => {
			it("does nothing by default", () => {
				// arrange
				const model = createModel();
				const msg = formMap.Msg.accept();
				const update = getUpdateFn(formMap.updateMap);

				// act
				const [newModel, cmd] = update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls onAccept if provided", () => {
				// arrange
				const model = createModel();
				const mockOnAccept = jest.fn();
				const formMapWithOnAccept = createFormMap({
					initValues,
					onAccept: mockOnAccept,
				});
				const msg = formMapWithOnAccept.Msg.accept();
				const update = getUpdateFn(formMapWithOnAccept.updateMap);

				// act
				const [newModel, cmd] = update(msg, model, props);

				// assert
				expect(mockOnAccept).toHaveBeenCalledWith(model, props);
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls onAccept with trimmed values if option is active", () => {
				// arrange
				const model = createModel({
					values: {
						value1: "  Test  ",
						value2: 1,
					},
				});
				const mockOnAccept = jest.fn();
				const formMapWithOnAccept = createFormMap({
					initValues,
					onAccept: mockOnAccept,
					trimValues: true,
				});
				const msg = formMapWithOnAccept.Msg.accept();
				const update = getUpdateFn(formMapWithOnAccept.updateMap);

				// act
				update(msg, model, props);

				// assert
				expect(mockOnAccept).toHaveBeenCalledWith({ ...model, values: { value1: "Test", value2: 1 } }, props);
			});

			it("calls onAccept with unchanged values if trim option is inactive", () => {
				// arrange
				const model = createModel({
					values: {
						value1: "  Test  ",
						value2: 1,
					},
				});
				const mockOnAccept = jest.fn();
				const formMapWithOnAccept = createFormMap({
					initValues,
					onAccept: mockOnAccept,
				});
				const msg = formMapWithOnAccept.Msg.accept();
				const update = getUpdateFn(formMapWithOnAccept.updateMap);

				// act
				update(msg, model, props);

				// assert
				expect(mockOnAccept).toHaveBeenCalledWith({ ...model, values: { value1: "  Test  ", value2: 1 } }, props);
			});
		});

		describe("cancelRequest", () => {
			it("dispatches cancel by default", async () => {
				// arrange
				const model = createModel();
				const msg = formMap.Msg.cancelRequest();
				const update = getUpdateAndExecCmdFn(formMap.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([formMap.Msg.cancel()]);
			});
		});

		describe("cancel", () => {
			it("does nothing by default", () => {
				// arrange
				const model = createModel();
				const msg = formMap.Msg.cancel();
				const update = getUpdateFn(formMap.updateMap);

				// act
				const [newModel, cmd] = update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls onCancel if provided", () => {
				// arrange
				const model = createModel();
				const mockOnCancel = jest.fn();
				const formMapWithOnCancel = createFormMap({
					initValues,
					onCancel: mockOnCancel,
				});
				const msg = formMapWithOnCancel.Msg.cancel();
				const update = getUpdateFn(formMapWithOnCancel.updateMap);

				// act
				const [newModel, cmd] = update(msg, model, props);

				// assert
				expect(mockOnCancel).toHaveBeenCalledWith(model, props);
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});
		});

		describe("validate", () => {
			it("returns no validation errors without a validation function", async () => {
				// arrange
				const model = createModel();
				const msg = formMap.Msg.validate(formMap.Msg.accept());
				const update = getUpdateAndExecCmdFn(formMap.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({ errors: [], validated: true });
				expect(messages).toStrictEqual([formMap.Msg.validated([], formMap.Msg.accept())]);
			});

			it("calls validate and resets validation errors, and gets correct validation errors", async () => {
				// arrange
				const model = createModel();
				const validationError = { key: "value1" as const, message: "error" };
				const mockValidate = jest.fn().mockResolvedValue([validationError]);
				const formMapWithValidation = createFormMap({
					initValues,
					validate: mockValidate,
				});
				const msg = formMapWithValidation.Msg.validate(formMapWithValidation.Msg.accept());
				const update = getUpdateAndExecCmdFn(formMapWithValidation.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(mockValidate).toHaveBeenCalledTimes(1);
				expect(mockValidate).toHaveBeenCalledWith({ ...model, reValidating: false }, props);
				expect(newModel).toStrictEqual({ errors: [], validated: true });
				expect(messages).toStrictEqual([
					formMapWithValidation.Msg.validated([validationError], formMapWithValidation.Msg.accept()),
				]);
			});

			it("calls validate callback with trimmed values if option is active", async () => {
				// arrange
				const model = createModel({
					values: {
						value1: "  Test  ",
						value2: 1,
					},
				});
				const mockValidate = jest.fn().mockResolvedValue([]);
				const formMapWithValidation = createFormMap({
					initValues,
					validate: mockValidate,
					trimValues: true,
				});
				const msg = formMapWithValidation.Msg.validate(formMapWithValidation.Msg.accept());
				const update = getUpdateAndExecCmdFn(formMapWithValidation.updateMap);

				// act
				await update(msg, model, props);

				// assert
				expect(mockValidate).toHaveBeenCalledTimes(1);
				expect(mockValidate).toHaveBeenCalledWith(
					{ ...model, values: { value1: "Test", value2: 1 }, reValidating: false },
					props,
				);
			});

			it("calls validate callback with unchanged values if trim option is inactive", async () => {
				// arrange
				const model = createModel({
					values: {
						value1: "  Test  ",
						value2: 1,
					},
				});
				const mockValidate = jest.fn().mockResolvedValue([]);
				const formMapWithValidation = createFormMap({
					initValues,
					validate: mockValidate,
				});
				const msg = formMapWithValidation.Msg.validate(formMapWithValidation.Msg.accept());
				const update = getUpdateAndExecCmdFn(formMapWithValidation.updateMap);

				// act
				await update(msg, model, props);

				// assert
				expect(mockValidate).toHaveBeenCalledTimes(1);
				expect(mockValidate).toHaveBeenCalledWith(
					{ ...model, values: { value1: "  Test  ", value2: 1 }, reValidating: false },
					props,
				);
			});
		});

		describe("validated", () => {
			it("sets errors when given", () => {
				// arrange
				const model = createModel();
				const errors = [{ key: "value1" as const, message: "message" }];
				const msg = formMap.Msg.validated(errors);
				const update = getUpdateFn(formMap.updateMap);

				// act
				const [newModel, cmd] = update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({ errors });
				expect(cmd).toBeUndefined();
			});

			it("calls given message without errors", async () => {
				// arrange
				const model = createModel();
				const msg = formMap.Msg.validated([], formMap.Msg.accept());
				const update = getUpdateAndExecCmdFn(formMap.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([formMap.Msg.accept()]);
			});

			it("does nothing without errors and message", () => {
				// arrange
				const model = createModel();
				const msg = formMap.Msg.validated([]);
				const update = getUpdateFn(formMap.updateMap);

				// act
				const [newModel, cmd] = update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls the onValidated callback if provided", () => {
				// arrange
				const model = createModel();
				const errors = [{ key: "value1" as const, message: "message" }];
				const mockOnValidated = jest.fn();
				const formMapWithOnValidated = createFormMap({
					initValues,
					onValidated: mockOnValidated,
				});
				const msg = formMapWithOnValidated.Msg.validated(errors);
				const update = getUpdateFn(formMapWithOnValidated.updateMap);

				// act
				update(msg, model, props);

				// assert
				expect(mockOnValidated).toHaveBeenCalledWith(errors, { ...model, reValidating: false }, props);
			});

			it("calls the onValidated callback with trimmed values if option is active", () => {
				// arrange
				const model = createModel({
					values: {
						value1: "  Test  ",
						value2: 1,
					},
				});
				const mockOnValidated = jest.fn();
				const formMapWithOnValidated = createFormMap({
					initValues,
					onValidated: mockOnValidated,
					trimValues: true,
				});
				const msg = formMapWithOnValidated.Msg.validated([]);
				const update = getUpdateFn(formMapWithOnValidated.updateMap);

				// act
				update(msg, model, props);

				// assert
				expect(mockOnValidated).toHaveBeenCalledWith(
					[],
					{ ...model, values: { value1: "Test", value2: 1 }, reValidating: false },
					props,
				);
			});

			it("calls the onValidated callback with unchanged values if trim option is inactive", () => {
				// arrange
				const model = createModel({
					values: {
						value1: "  Test  ",
						value2: 1,
					},
				});
				const mockOnValidated = jest.fn();
				const formMapWithOnValidated = createFormMap({
					initValues,
					onValidated: mockOnValidated,
				});
				const msg = formMapWithOnValidated.Msg.validated([]);
				const update = getUpdateFn(formMapWithOnValidated.updateMap);

				// act
				update(msg, model, props);

				// assert
				expect(mockOnValidated).toHaveBeenCalledWith(
					[],
					{ ...model, values: { value1: "  Test  ", value2: 1 }, reValidating: false },
					props,
				);
			});
		});

		describe("reValidate", () => {
			it("does nothing when not validated", () => {
				// arrange
				const model = createModel({ validated: false });
				const msg = formMap.Msg.reValidate();
				const update = getUpdateFn(formMap.updateMap);

				// act
				const [newModel, cmd] = update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls validate if validated previously", async () => {
				// arrange
				const model = createModel({ validated: true });
				const msg = formMap.Msg.reValidate();
				const update = getUpdateAndExecCmdFn(formMap.updateMap);

				// act
				const [newModel, messages] = await update(msg, model, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([formMap.Msg.validate()]);
			});

			it("calls validate function with revalidation set if validated previously", async () => {
				// arrange
				const model = createModel({ validated: true });
				const mockValidate = jest.fn().mockResolvedValue([]);
				const formMapWithValidation = createFormMap({
					initValues,
					validate: mockValidate,
				});
				const update = getUpdateAndExecCmdFn(formMapWithValidation.updateMap);

				// act
				await update(formMap.Msg.reValidate(), model, props);

				await update(formMapWithValidation.Msg.validate(), model, props);

				// assert
				expect(mockValidate).toHaveBeenCalledWith({ ...model, reValidating: true }, props);
			});
		});
	});
});

function createModel(template?: Partial<TestModel>): TestModel {
	return {
		errors: [],
		validated: false,
		values: {
			value1: "",
			value2: 0,
		},
		...template,
	};
}

function createProps(template?: Partial<TestProps>): TestProps {
	return {
		...template,
	};
}
