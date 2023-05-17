import * as ElmTesting from "react-elmish/dist/Testing";
import * as TypeMoq from "typemoq";
import * as Form from "../../src/Form/Form";

interface TestFormValues {
    value1: string,
    value2: number,
}

interface TestModel extends Form.Model<TestFormValues> {}
interface TestProps {}

function initValues (): TestFormValues {
    return {
        value1: "Test",
        value2: 1,
    };
}

describe("FormScreen", () => {
    let form: Form.Form<TestModel, TestProps, TestFormValues>;

    beforeEach(() => {
        form = Form.createForm({
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
            it("merges values and re-validates", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.valueChanged({ value1: "Modified" });

                mockModel.setup(model => model.values).returns(() => ({
                    value1: "Test",
                    value2: 1,
                }));

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual<Partial<TestModel>>({
                    values: {
                        value1: "Modified",
                        value2: 1,
                    },
                });
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.reValidate()]);
            });

            it("calls onValueChanged if provided and takes the returned values", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const onValueChanged = (value: Partial<TestFormValues>): Partial<TestFormValues> => ({
                    value1: value.value1,
                    value2: 2,
                });
                const formWithOnValueChanged = Form.createForm({
                    initValues,
                    onValueChanged,
                });
                const msg = formWithOnValueChanged.Msg.valueChanged({ value1: "Modified" });

                mockModel.setup(model => model.values).returns(() => ({
                    value1: "Test",
                    value2: 1,
                }));

                // act
                const [newModel, cmd] = formWithOnValueChanged.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual<Partial<TestModel>>({
                    values: {
                        value1: "Modified",
                        value2: 2,
                    },
                });
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.reValidate()]);
            });
        });

        describe("AcceptRequest", () => {
            it("calls validation", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.acceptRequest();

                mockModel.setup(model => model.validated).returns(() => false);

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.validate(form.Msg.accept())]);
            });
        });

        describe("Accept", () => {
            it("does nothing by default", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.accept();

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });

            it("calls onAccept if provided", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const mockOnAccept = jest.fn();
                const formWithOnAccept = Form.createForm({
                    initValues,
                    onAccept: mockOnAccept,
                });

                const msg = formWithOnAccept.Msg.accept();

                // act
                const [newModel, cmd] = formWithOnAccept.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(mockOnAccept).toHaveBeenCalledWith(mockModel.object, mockProps.object);
                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("CancelRequest", () => {
            it("dispatches Cancel by default", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.cancelRequest();

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.cancel()]);
            });
        });

        describe("Cancel", () => {
            it("does nothing by default", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.cancel();

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });

            it("calls onCancel if provided", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const mockOnCancel = jest.fn();
                const formWithOnCancel = Form.createForm({
                    initValues,
                    onCancel: mockOnCancel,
                });

                const msg = formWithOnCancel.Msg.cancel();

                // act
                const [newModel, cmd] = formWithOnCancel.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(mockOnCancel).toHaveBeenCalledWith(mockModel.object, mockProps.object);
                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("Validate", () => {
            it("returns no validation errors without a validation function", async () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.validate(form.Msg.accept());

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);
                const messages = await ElmTesting.execCmd(cmd);

                // assert
                expect(newModel).toStrictEqual({ errors: [], validated: true });
                expect(messages).toStrictEqual([form.Msg.validated([], form.Msg.accept())]);
            });

            it("calls validate and resets validation errors, and gets correct validation errors", async () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const validationError = { key: "value1" as const, message: "error" };
                const mockValidate = jest.fn().mockResolvedValue([validationError]);

                const formWithValidation = Form.createForm({
                    initValues,
                    validate: mockValidate,
                });

                const msg = formWithValidation.Msg.validate(formWithValidation.Msg.accept());

                // act
                const [newModel, cmd] = formWithValidation.update(mockModel.object, msg, mockProps.object);
                const messages = await ElmTesting.execCmd(cmd);

                // assert
                expect(mockValidate).toHaveBeenCalledTimes(1);
                expect(mockValidate).toHaveBeenCalledWith(mockModel.object, mockProps.object);
                expect(newModel).toStrictEqual({ errors: [], validated: true });
                expect(messages).toStrictEqual([formWithValidation.Msg.validated([validationError], formWithValidation.Msg.accept())]);
            });
        });

        describe("Validated", () => {
            it("sets errors when given", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const errors = [{ key: "value1" as const, message: "message" }];
                const msg = form.Msg.validated(errors);

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({ errors });
                expect(cmd).toBeUndefined();
            });

            it("calls given message without errors", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.validated([], form.Msg.accept());

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.accept()]);
            });

            it("does nothing without errors and message", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.validated([]);

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("ReValidate", () => {
            it("does nothing when not validated", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.reValidate();

                mockModel.setup(model => model.validated).returns(() => false);

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });

            it("calls validate if validated previously", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<TestModel>();
                const mockProps = TypeMoq.Mock.ofType<TestProps>();
                const msg = form.Msg.reValidate();

                mockModel.setup(model => model.validated).returns(() => true);

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert

                expect(newModel).toStrictEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.validate()]);
            });
        });
    });
});