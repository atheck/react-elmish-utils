import * as ElmTesting from "react-elmish/dist/Testing";
import * as Form from "../../src/Form/Form";
import * as TypeMoq from "typemoq";
import { ValidationError } from "../../src/Validation";

describe("FormScreen", () => {
    describe("init", () => {
        it("returns correct values", () => {
            // arrange
            const form = Form.createForm({
                getData: jest.fn(),
            });

            // act
            const model = form.init();

            // assert
            expect(model).toStrictEqual<Form.Model>({
                errors: [],
                validated: false,
            });
        });
    });

    describe("update", () => {
        describe("AcceptRequest", () => {
            it("calls validation", () => {
                // arrange
                const mockModel = TypeMoq.Mock.ofType<Form.Model>();
                const mockProps = TypeMoq.Mock.ofType<Form.Props<number>>();
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
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
            it("calls getData and onAccept", () => {
                // arrange
                const getData = jest.fn().mockReturnValue(42);
                const options = {
                    getData,
                };
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.accept());
                const onAccept = jest.fn();

                mockProps.setup(props => props.onAccept).returns(() => onAccept);

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(getData).toHaveBeenCalledTimes(1);
                expect(onAccept).toHaveBeenCalledWith(42);

                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("CancelRequest", () => {
            it("dispatches Cancel by default", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.cancelRequest());

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.cancel()]);
            });
        });

        describe("Cancel", () => {
            it("calls onCancel", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.cancel());
                const onCancel = jest.fn();

                mockProps.setup(props => props.onCancel).returns(() => onCancel);

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(onCancel).toHaveBeenCalledTimes(1);
                expect(newModel).toStrictEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("Validate", () => {
            it("returns no validation errors without a validation function", async () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.validate(form.Msg.accept()));

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);
                const messages = await ElmTesting.execCmd(cmd);

                // assert
                expect(newModel).toStrictEqual({ ...mockModel.object, errors: [], validated: true });
                expect(messages).toStrictEqual([form.Msg.validated([], form.Msg.accept())]);
            });

            it("calls validate and resets validation errors, and gets correct validation errors", async () => {
                // arrange
                const validationError: ValidationError = { key: "value", message: "error" };
                const mockValidate = jest.fn().mockResolvedValue([validationError]);
                const options = {
                    getData: jest.fn(),
                    validate: mockValidate,
                };
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.validate(form.Msg.accept()));

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);
                const messages = await ElmTesting.execCmd(cmd);

                // assert
                expect(mockValidate).toHaveBeenCalledTimes(1);
                expect(mockValidate).toHaveBeenCalledWith(mockModel.object, mockProps.object);
                expect(newModel).toStrictEqual({ ...mockModel.object, errors: [], validated: true });
                expect(messages).toStrictEqual([form.Msg.validated([validationError], form.Msg.accept())]);
            });
        });

        describe("Validated", () => {
            it("sets errors when given", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const errors = [{ key: "key", message: "message" }];
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.validated(errors));

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({ ...mockModel.object, errors });
                expect(cmd).toBeUndefined();
            });

            it("calls given message without errors", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.validated([], form.Msg.accept()));

                // act
                const [newModel, cmd] = form.update(mockModel.object, msg, mockProps.object);

                // assert
                expect(newModel).toStrictEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toStrictEqual([form.Msg.accept()]);
            });

            it("does nothing without errors and message", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [mockModel, mockProps, msg] = createMocks(form.Msg.validated([]));

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
                const mockModel = TypeMoq.Mock.ofType<Form.Model>();
                const mockProps = TypeMoq.Mock.ofType<Form.Props<number>>();
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
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
                const mockModel = TypeMoq.Mock.ofType<Form.Model>();
                const mockProps = TypeMoq.Mock.ofType<Form.Props<number>>();
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
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

function createMocks (msg: Form.Message): [TypeMoq.IMock<Form.Model>, TypeMoq.IMock<Form.Props<number>>, Form.Message] {
    return [
        TypeMoq.Mock.ofType<Form.Model>(),
        TypeMoq.Mock.ofType<Form.Props<number>>(),
        msg,
    ];
}