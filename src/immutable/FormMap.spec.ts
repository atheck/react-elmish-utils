import { getUpdateAndExecCmdFn, getUpdateFn } from "react-elmish/immutable/testing";
import type { Model } from "../Form";
import { createFormMap } from "./FormMap";

interface TestFormValues {
	value1: string;
	value2: number;
}

interface TestModel extends Model<TestFormValues> {}

interface TestProps {}

function initValues(): TestFormValues {
	return { value1: "Test", value2: 1 };
}

function createModel(overrides: Partial<TestModel> = {}): TestModel {
	return {
		values: { value1: "Test", value2: 1 },
		errors: [],
		validated: false,
		...overrides,
	};
}

const props: TestProps = {};

describe("immutable/FormMap", () => {
	describe("init", () => {
		it("returns the initial model", () => {
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues });

			expect(formMap.init(props)).toStrictEqual<TestModel>({
				values: { value1: "Test", value2: 1 },
				errors: [],
				validated: false,
			});
		});
	});

	describe("valueChanged", () => {
		it("merges the changed value and re-validates", async () => {
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues });
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			const [newModel, messages] = await update(formMap.Msg.valueChanged({ value1: "Modified" }), createModel(), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ values: { value1: "Modified", value2: 1 } });
			expect(messages).toStrictEqual([formMap.Msg.reValidate()]);
		});

		it("takes the values returned by onValueChanged", async () => {
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({
				initValues,
				onValueChanged: (value) => ({ value1: value.value1, value2: 2 }),
			});
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			const [newModel] = await update(formMap.Msg.valueChanged({ value1: "Modified" }), createModel(), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ values: { value1: "Modified", value2: 2 } });
		});
	});

	describe("acceptRequest", () => {
		it("triggers validation followed by accept", async () => {
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues });
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			const [, messages] = await update(formMap.Msg.acceptRequest(), createModel(), props);

			expect(messages).toStrictEqual([formMap.Msg.validate(formMap.Msg.accept())]);
		});
	});

	describe("accept", () => {
		it("calls onAccept with trimmed values when trimValues is set", () => {
			const onAccept = jest.fn();
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues, onAccept, trimValues: true });
			const update = getUpdateFn(formMap.updateMap);
			const model = createModel({ values: { value1: "  Test  ", value2: 1 } });

			update(formMap.Msg.accept(), model, props);

			expect(onAccept).toHaveBeenCalledWith({ ...model, values: { value1: "Test", value2: 1 } }, props);
		});
	});

	describe("validate", () => {
		it("resets errors, marks validated and runs the validation", async () => {
			const error = { key: "value1" as keyof TestFormValues, message: "invalid" };
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({
				initValues,
				validate: async () => [error],
			});
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			const [newModel, messages] = await update(formMap.Msg.validate(), createModel({ errors: [error] }), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ errors: [], validated: true });
			expect(messages).toStrictEqual([formMap.Msg.validated([error])]);
		});

		it("passes trimmed values to the validation when trimValues is set", async () => {
			const validate = jest.fn(async () => []);
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues, validate, trimValues: true });
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			await update(formMap.Msg.validate(), createModel({ values: { value1: "  Test  ", value2: 1 } }), props);

			expect(validate).toHaveBeenCalledWith(expect.objectContaining({ values: { value1: "Test", value2: 1 } }), props);
		});
	});

	describe("validated", () => {
		it("stores the errors when validation failed", () => {
			const error = { key: "value1" as keyof TestFormValues, message: "invalid" };
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues });
			const update = getUpdateFn(formMap.updateMap);

			const [newModel, cmd] = update(formMap.Msg.validated([error]), createModel({ validated: true }), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ errors: [error] });
			expect(cmd).toBeUndefined();
		});

		it("dispatches the follow-up message on success", async () => {
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues });
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			const [newModel, messages] = await update(
				formMap.Msg.validated([], formMap.Msg.accept()),
				createModel({ validated: true }),
				props,
			);

			expect(newModel).toStrictEqual<Partial<TestModel>>({});
			expect(messages).toStrictEqual([formMap.Msg.accept()]);
		});

		it("calls onValidated with trimmed values and the reValidating flag when trimValues is set", () => {
			const onValidated = jest.fn();
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues, onValidated, trimValues: true });
			const update = getUpdateFn(formMap.updateMap);

			update(formMap.Msg.validated([]), createModel({ values: { value1: "  Test  ", value2: 1 }, validated: true }), props);

			expect(onValidated).toHaveBeenCalledWith(
				[],
				expect.objectContaining({ values: { value1: "Test", value2: 1 }, reValidating: false }),
				props,
			);
		});
	});

	describe("reValidate", () => {
		it("re-validates when the form was already validated", async () => {
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues });
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			const [, messages] = await update(formMap.Msg.reValidate(), createModel({ validated: true }), props);

			expect(messages).toStrictEqual([formMap.Msg.validate()]);
		});

		it("does nothing when the form was not validated yet", async () => {
			const formMap = createFormMap<TestModel, TestProps, TestFormValues>({ initValues });
			const update = getUpdateAndExecCmdFn(formMap.updateMap);

			const [, messages] = await update(formMap.Msg.reValidate(), createModel({ validated: false }), props);

			expect(messages).toStrictEqual([]);
		});
	});
});
