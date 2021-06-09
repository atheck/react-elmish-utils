import * as Form from "../../src/Form/Form";
import * as ElmTesting from "react-elmish/dist/Testing";
import * as TypeMoq from "typemoq";

describe("FormScreen", () => {
    describe("update", () => {
        describe("AcceptRequest", () => {
            it("calls validation", () => {
                // arrange
                const model = TypeMoq.Mock.ofType<Form.Model>();
                const props = TypeMoq.Mock.ofType<Form.Props<number>>();
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const msg = form.Msg.acceptRequest();

                model.setup(m => m.validated).returns(() => false);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(newModel).toEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toEqual([form.Msg.validate(form.Msg.accept())]);
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
                const [model, props, msg] = createMocks(form.Msg.accept());
                const onAccept = jest.fn();

                props.setup(p => p.onAccept).returns(() => onAccept);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(getData).toBeCalledTimes(1);
                expect(onAccept).toBeCalledTimes(1);
                expect(onAccept).toBeCalledWith(42);

                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("CancelRequest", () => {
            it("dispatches Cancel when onCancelRequest not specified", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.cancelRequest());

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(newModel).toEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toEqual([form.Msg.cancel()]);
            });

            it("calls onCancelRequest if specified", async () => {
                // arrange
                const mockCancelRequest = jest.fn().mockReturnValue([{}]);
                const options = {
                    getData: jest.fn(),
                    onCancelRequest: mockCancelRequest,
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.cancelRequest());

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(mockCancelRequest).toHaveBeenCalledTimes(1);
                expect(mockCancelRequest).toHaveBeenCalledWith(model.object, props.object, [expect.any(Function)]);
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("Cancel", () => {
            it("calls onCancel", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.cancel());
                const onCancel = jest.fn();

                props.setup(p => p.onCancel).returns(() => onCancel);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(onCancel).toBeCalledTimes(1);
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("Validate", () => {
            it("calls validate and resets validation errors", async () => {
                // arrange
                const mockValidate = jest.fn().mockResolvedValue([]);
                const options = {
                    getData: jest.fn(),
                    validate: mockValidate,
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.validate(form.Msg.accept()));

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);
                const messages = await ElmTesting.execCmd(cmd);

                // assert
                expect(mockValidate).toBeCalledTimes(1);
                expect(mockValidate).toHaveBeenCalledWith(model.object, props.object);
                expect(newModel).toEqual({ ...model.object, errors: [], validated: true });
                expect(messages).toEqual([form.Msg.validated([], form.Msg.accept())]);
            });
        });

        describe("Validated", () => {
            it("sets errors when given", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const errors = [
                    { key: "key", message: "message" },
                ];
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.validated(errors));

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(newModel).toEqual({ ...model.object, errors });
                expect(cmd).toBeUndefined();
            });

            it("calls given message without errors", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.validated([], form.Msg.accept()));

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(newModel).toEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toEqual([form.Msg.accept()]);
            });

            it("does nothing without errors and message", () => {
                // arrange
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.validated([]));

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("ReValidate", () => {
            it("does nothing when not validated", () => {
                // arrange
                const model = TypeMoq.Mock.ofType<Form.Model>();
                const props = TypeMoq.Mock.ofType<Form.Props<number>>();
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const msg = form.Msg.reValidate();

                model.setup(m => m.validated).returns(() => false);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });

            it("calls validate if validated previously", () => {
                // arrange
                const model = TypeMoq.Mock.ofType<Form.Model>();
                const props = TypeMoq.Mock.ofType<Form.Props<number>>();
                const options = {
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const msg = form.Msg.reValidate();

                model.setup(m => m.validated).returns(() => true);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert

                expect(newModel).toEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toEqual([form.Msg.validate()]);
            });
        });
    });
});

const createMocks = (msg: Form.Message): [TypeMoq.IMock<Form.Model>, TypeMoq.IMock<Form.Props<number>>, Form.Message] => {
    return [
        TypeMoq.Mock.ofType<Form.Model>(),
        TypeMoq.Mock.ofType<Form.Props<number>>(),
        msg,
    ];
};