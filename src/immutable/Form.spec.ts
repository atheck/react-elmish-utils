import type { Message, Model } from "../Form";
import { createForm, type Form } from "./Form";
import { type ElmishStateResult, getElmishState } from "./Testing";

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

function createTestState(
	form: Form<TestModel, TestProps, TestFormValues>,
): ElmishStateResult<TestProps, TestModel, Message<TestFormValues>> {
	return getElmishState(
		() => ({ init: (currentProps: TestProps) => [form.init(currentProps)], update: form.update }),
		() => props,
		{},
	);
}

describe("immutable/Form", () => {
	describe("init", () => {
		it("returns the initial model", () => {
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues });

			expect(form.init(props)).toStrictEqual<TestModel>({
				values: { value1: "Test", value2: 1 },
				errors: [],
				validated: false,
			});
		});
	});

	describe("ValueChanged", () => {
		it("merges the changed value and re-validates", async () => {
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues });
			const { updateAndExecCmd } = createTestState(form);

			const [newModel, messages] = await updateAndExecCmd(form.Msg.valueChanged({ value1: "Modified" }), createModel(), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ values: { value1: "Modified", value2: 1 } });
			expect(messages).toStrictEqual([form.Msg.reValidate()]);
		});

		it("takes the values returned by onValueChanged", async () => {
			const form = createForm<TestModel, TestProps, TestFormValues>({
				initValues,
				onValueChanged: (value) => ({ value1: value.value1, value2: 2 }),
			});
			const { updateAndExecCmd } = createTestState(form);

			const [newModel] = await updateAndExecCmd(form.Msg.valueChanged({ value1: "Modified" }), createModel(), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ values: { value1: "Modified", value2: 2 } });
		});
	});

	describe("AcceptRequest", () => {
		it("triggers validation followed by accept", async () => {
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues });
			const { updateAndExecCmd } = createTestState(form);

			const [, messages] = await updateAndExecCmd(form.Msg.acceptRequest(), createModel(), props);

			expect(messages).toStrictEqual([form.Msg.validate(form.Msg.accept())]);
		});
	});

	describe("Accept", () => {
		it("calls onAccept", () => {
			const onAccept = jest.fn();
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues, onAccept });
			const { update } = createTestState(form);
			const model = createModel();

			update(form.Msg.accept(), model, props);

			expect(onAccept).toHaveBeenCalledWith(model, props);
		});
	});

	describe("Cancel", () => {
		it("calls onCancel", () => {
			const onCancel = jest.fn();
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues, onCancel });
			const { update } = createTestState(form);
			const model = createModel();

			update(form.Msg.cancel(), model, props);

			expect(onCancel).toHaveBeenCalledWith(model, props);
		});
	});

	describe("Validate", () => {
		it("resets errors, marks validated and runs the validation", async () => {
			const error = { key: "value1" as keyof TestFormValues, message: "invalid" };
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues, validate: async () => [error] });
			const { updateAndExecCmd } = createTestState(form);

			const [newModel, messages] = await updateAndExecCmd(form.Msg.validate(), createModel({ errors: [error] }), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ errors: [], validated: true });
			expect(messages).toStrictEqual([form.Msg.validated([error])]);
		});

		it("validates against the model state from before errors and validated are reset", async () => {
			const validate = jest.fn(async () => []);
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues, validate });
			const { updateAndExecCmd } = createTestState(form);
			const error = { key: "value1" as keyof TestFormValues, message: "invalid" };

			await updateAndExecCmd(form.Msg.validate(), createModel({ validated: false, errors: [error] }), props);

			expect(validate).toHaveBeenCalledWith(
				expect.objectContaining({ validated: false, errors: [error], reValidating: false }),
				props,
			);
		});
	});

	describe("Validated", () => {
		it("stores the errors when validation failed", () => {
			const error = { key: "value1" as keyof TestFormValues, message: "invalid" };
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues });
			const { update } = createTestState(form);

			const [newModel, ...commands] = update(form.Msg.validated([error]), createModel({ validated: true }), props);

			expect(newModel).toStrictEqual<Partial<TestModel>>({ errors: [error] });
			expect(commands).toStrictEqual([]);
		});

		it("dispatches the follow-up message on success", async () => {
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues });
			const { updateAndExecCmd } = createTestState(form);

			const [newModel, messages] = await updateAndExecCmd(
				form.Msg.validated([], form.Msg.accept()),
				createModel({ validated: true }),
				props,
			);

			expect(newModel).toStrictEqual<Partial<TestModel>>({});
			expect(messages).toStrictEqual([form.Msg.accept()]);
		});

		it("calls onValidated with the errors and the reValidating flag", () => {
			const onValidated = jest.fn();
			const error = { key: "value1" as keyof TestFormValues, message: "invalid" };
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues, onValidated });
			const { update } = createTestState(form);

			update(form.Msg.validated([error]), createModel({ validated: true }), props);

			expect(onValidated).toHaveBeenCalledWith([error], expect.objectContaining({ reValidating: false }), props);
		});
	});

	describe("ReValidate", () => {
		it("re-validates when the form was already validated", async () => {
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues });
			const { updateAndExecCmd } = createTestState(form);

			const [, messages] = await updateAndExecCmd(form.Msg.reValidate(), createModel({ validated: true }), props);

			expect(messages).toStrictEqual([form.Msg.validate()]);
		});
	});

	describe("consecutiveUpdate", () => {
		it("runs the whole accept flow consecutively", async () => {
			const onAccept = jest.fn();
			const form = createForm<TestModel, TestProps, TestFormValues>({ initValues, onAccept });
			const { consecutiveUpdate } = createTestState(form);

			await consecutiveUpdate(form.Msg.acceptRequest(), createModel(), props);

			expect(onAccept).toHaveBeenCalledWith(
				{ values: { value1: "Test", value2: 1 }, errors: [], validated: true },
				props,
			);
		});
	});
});
