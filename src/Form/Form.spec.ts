import { execCmd } from "react-elmish/testing";
import { createForm, type Form, type Model } from "./Form";

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

describe("FormScreen", () => {
	let form: Form<TestModel, TestProps, TestFormValues>;

	beforeEach(() => {
		form = createForm({
			initValues,
		});
	});

	describe("init", () => {
		it("returns correct values", () => {
			// act
			const model = form.init({});

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
		describe("ValueChanged", () => {
			it("merges values and re-validates", async () => {
				// arrange
				const model = createModel({
					values: {
						value1: "Test",
						value2: 1,
					},
				});
				const props = createProps();
				const msg = form.Msg.valueChanged({ value1: "Modified" });

				// act
				const [newModel, cmd] = form.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<TestModel>>({
					values: {
						value1: "Modified",
						value2: 1,
					},
				});
				expect(messages).toStrictEqual([form.Msg.reValidate()]);
			});

			it("calls onValueChanged if provided and takes the returned values", async () => {
				// arrange
				const model = createModel({
					values: {
						value1: "Test",
						value2: 1,
					},
				});
				const props = createProps();
				const onValueChanged = (value: Partial<TestFormValues>): Partial<TestFormValues> => ({
					value1: value.value1,
					value2: 2,
				});
				const formWithOnValueChanged = createForm({
					initValues,
					onValueChanged,
				});
				const msg = formWithOnValueChanged.Msg.valueChanged({ value1: "Modified" });

				// act
				const [newModel, cmd] = formWithOnValueChanged.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual<Partial<TestModel>>({
					values: {
						value1: "Modified",
						value2: 2,
					},
				});
				expect(messages).toStrictEqual([form.Msg.reValidate()]);
			});
		});

		describe("AcceptRequest", () => {
			it("calls validation", async () => {
				// arrange
				const model = createModel({ validated: false });
				const props = createProps();
				const msg = form.Msg.acceptRequest();

				// act
				const [newModel, cmd] = form.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([form.Msg.validate(form.Msg.accept())]);
			});
		});

		describe("Accept", () => {
			it("does nothing by default", () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const msg = form.Msg.accept();

				// act
				const [newModel, cmd] = form.update(model, msg, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls onAccept if provided", () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const mockOnAccept = jest.fn();
				const formWithOnAccept = createForm({
					initValues,
					onAccept: mockOnAccept,
				});

				const msg = formWithOnAccept.Msg.accept();

				// act
				const [newModel, cmd] = formWithOnAccept.update(model, msg, props);

				// assert
				expect(mockOnAccept).toHaveBeenCalledWith(model, props);
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});
		});

		describe("CancelRequest", () => {
			it("dispatches Cancel by default", async () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const msg = form.Msg.cancelRequest();

				// act
				const [newModel, cmd] = form.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([form.Msg.cancel()]);
			});
		});

		describe("Cancel", () => {
			it("does nothing by default", () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const msg = form.Msg.cancel();

				// act
				const [newModel, cmd] = form.update(model, msg, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls onCancel if provided", () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const mockOnCancel = jest.fn();
				const formWithOnCancel = createForm({
					initValues,
					onCancel: mockOnCancel,
				});

				const msg = formWithOnCancel.Msg.cancel();

				// act
				const [newModel, cmd] = formWithOnCancel.update(model, msg, props);

				// assert
				expect(mockOnCancel).toHaveBeenCalledWith(model, props);
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});
		});

		describe("Validate", () => {
			it("returns no validation errors without a validation function", async () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const msg = form.Msg.validate(form.Msg.accept());

				// act
				const [newModel, cmd] = form.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual({ errors: [], validated: true });
				expect(messages).toStrictEqual([form.Msg.validated([], form.Msg.accept())]);
			});

			it("calls validate and resets validation errors, and gets correct validation errors", async () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const validationError = { key: "value1" as const, message: "error" };
				const mockValidate = jest.fn().mockResolvedValue([validationError]);

				const formWithValidation = createForm({
					initValues,
					validate: mockValidate,
				});

				const msg = formWithValidation.Msg.validate(formWithValidation.Msg.accept());

				// act
				const [newModel, cmd] = formWithValidation.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(mockValidate).toHaveBeenCalledTimes(1);
				expect(mockValidate).toHaveBeenCalledWith({ ...model, reValidating: false }, props);
				expect(newModel).toStrictEqual({ errors: [], validated: true });
				expect(messages).toStrictEqual([formWithValidation.Msg.validated([validationError], formWithValidation.Msg.accept())]);
			});
		});

		describe("Validated", () => {
			it("sets errors when given", () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const errors = [{ key: "value1" as const, message: "message" }];
				const msg = form.Msg.validated(errors);

				// act
				const [newModel, cmd] = form.update(model, msg, props);

				// assert
				expect(newModel).toStrictEqual({ errors });
				expect(cmd).toBeUndefined();
			});

			it("calls given message without errors", async () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const msg = form.Msg.validated([], form.Msg.accept());

				// act
				const [newModel, cmd] = form.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([form.Msg.accept()]);
			});

			it("does nothing without errors and message", () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const msg = form.Msg.validated([]);

				// act
				const [newModel, cmd] = form.update(model, msg, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls the onValidated callback if provided", () => {
				// arrange
				const model = createModel();
				const props = createProps();
				const errors = [{ key: "value1" as const, message: "message" }];
				const mockOnValidated = jest.fn();
				const formWithOnValidated = createForm({
					initValues,
					onValidated: mockOnValidated,
				});
				const msg = formWithOnValidated.Msg.validated(errors);

				// act
				formWithOnValidated.update(model, msg, props);

				// assert
				expect(mockOnValidated).toHaveBeenCalledWith(errors, { ...model, reValidating: false }, props);
			});
		});

		describe("ReValidate", () => {
			it("does nothing when not validated", () => {
				// arrange
				const model = createModel({ validated: false });
				const props = createProps();
				const msg = form.Msg.reValidate();

				// act
				const [newModel, cmd] = form.update(model, msg, props);

				// assert
				expect(newModel).toStrictEqual({});
				expect(cmd).toBeUndefined();
			});

			it("calls validate if validated previously", async () => {
				// arrange
				const model = createModel({ validated: true });
				const props = createProps();
				const msg = form.Msg.reValidate();

				// act
				const [newModel, cmd] = form.update(model, msg, props);
				const messages = await execCmd(cmd);

				// assert
				expect(newModel).toStrictEqual({});
				expect(messages).toStrictEqual([form.Msg.validate()]);
			});

			it("calls validate function with revalidation set if validated previously", async () => {
				// arrange
				const model = createModel({ validated: true });
				const props = createProps();
				const mockValidate = jest.fn().mockResolvedValue([]);
				const formWithValidation = createForm({
					initValues,
					validate: mockValidate,
				});

				// act
				let [, cmd] = formWithValidation.update(model, form.Msg.reValidate(), props);

				await execCmd(cmd);

				[, cmd] = formWithValidation.update(model, formWithValidation.Msg.validate(), props);

				await execCmd(cmd);

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
