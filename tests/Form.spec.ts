import * as Form from "../src/Form";
import * as ElmTesting from "react-elmish/dist/Testing";
import * as TypeMoq from "typemoq";

describe("FormScreen", () => {
    describe("update", () => {
        describe("ReValidate", () => {
            it("does nothing when not validated", () => {
                // arrange
                const model = TypeMoq.Mock.ofType<Form.Model>();
                const props = TypeMoq.Mock.ofType<Form.Props<number>>();
                const msg = Form.Msg.reValidate();
                const options: Form.UpdateOptions<number, Form.Model> = {
                    validate: jest.fn(),
                    getData: jest.fn(),
                };

                model.setup(m => m.validated).returns(() => false);

                // act
                const [newModel, cmd] = Form.update(model.object, msg, props.object, options);

                // assert
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });

            it("calls the validation and saves the errors when already validated", () => {
                // arrange
                const model = TypeMoq.Mock.ofType<Form.Model>();
                const props = TypeMoq.Mock.ofType<Form.Props<number>>();
                const msg = Form.Msg.reValidate();

                const validationResult = [{ key: "key", message: "message" }];
                const validate = jest.fn().mockReturnValue(validationResult);

                const options: Form.UpdateOptions<number, Form.Model> = {
                    validate,
                    getData: jest.fn(),
                };

                model.setup(m => m.validated).returns(() => true);

                // act
                const [newModel, cmd] = Form.update(model.object, msg, props.object, options);

                // assert
                expect(validate).toBeCalledTimes(1);
                expect(validate).toBeCalledWith(model.object);

                expect(newModel).toEqual({ ...model.object, errors: validationResult });
                expect(cmd).toBeUndefined();
            });
        });

        describe("Accept", () => {
            it("it validates, calls getData and onAccept without validation errors", () => {
                // arrange
                const [model, props, msg] = createMocks(Form.Msg.accept());

                const validate = jest.fn().mockReturnValue([]);
                const onAccept = jest.fn();
                const getData = jest.fn().mockReturnValue(42);

                const options: Form.UpdateOptions<number, Form.Model> = {
                    validate,
                    getData,
                };

                props.setup(p => p.onAccept).returns(() => onAccept);

                // act
                const [newModel, cmd] = Form.update(model.object, msg, props.object, options);

                // assert
                expect(validate).toBeCalledTimes(1);
                expect(validate).toBeCalledWith(model.object);

                expect(getData).toBeCalledTimes(1);
                expect(onAccept).toBeCalledTimes(1);
                expect(onAccept).toBeCalledWith(42);

                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });

            it("it validates and saves the errors with validation errors", () => {
                // arrange
                const [model, props, msg] = createMocks(Form.Msg.accept());

                const validationErrors = [{ key: "key", message: "message" }];

                const validate = jest.fn().mockReturnValue(validationErrors);
                const onAccept = jest.fn();
                const getData = jest.fn();

                const options: Form.UpdateOptions<number, Form.Model> = {
                    validate,
                    getData,
                };

                props.setup(p => p.onAccept).returns(() => onAccept);

                // act
                const [newModel, cmd] = Form.update(model.object, msg, props.object, options);

                // assert
                expect(validate).toBeCalledTimes(1);
                expect(validate).toBeCalledWith(model.object);

                expect(getData).not.toBeCalled();
                expect(onAccept).not.toBeCalled();

                expect(newModel).toEqual({ ...model.object, validated: true, errors: validationErrors });
                expect(cmd).toBeUndefined();
            });
        });

        describe("CancelRequest", () => {
            it("dispatches Cancel when not modified", () => {
                // arrange
                const [model, props, msg] = createMocks(Form.Msg.cancelRequest());

                const options: Form.UpdateOptions<number, Form.Model> = {
                    validate: jest.fn(),
                    getData: jest.fn(),
                };

                model.setup(m => m.modified).returns(() => false);

                // act
                const [newModel, cmd] = Form.update(model.object, msg, props.object, options);

                // assert
                expect(newModel).toEqual({});
                expect(ElmTesting.getOfMsgParams(cmd)).toEqual([Form.Msg.cancel()]);
            });

            it("calls onCancelRequest when modified", async () => {
                // arrange
                const [model, props, msg] = createMocks(Form.Msg.cancelRequest());
                const mockCancelRequest = jest.fn().mockReturnValue([{}]);

                const options: Form.UpdateOptions<number, Form.Model> = {
                    validate: jest.fn(),
                    getData: jest.fn(),
                    onCancelRequest: mockCancelRequest,
                };

                model.setup(m => m.modified).returns(() => true);

                // act
                const [newModel, cmd] = Form.update(model.object, msg, props.object, options);

                // assert
                expect(mockCancelRequest).toBeCalledTimes(1);
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("Cancel", () => {
            it("calls onCancel", () => {
                // arrange
                const [model, props, msg] = createMocks(Form.Msg.cancel());
                const onCancel = jest.fn();

                const options: Form.UpdateOptions<number, Form.Model> = {
                    validate: jest.fn(),
                    getData: jest.fn(),
                };

                props.setup(p => p.onCancel).returns(() => onCancel);

                // act
                const [newModel, cmd] = Form.update(model.object, msg, props.object, options);

                // assert
                expect(onCancel).toBeCalledTimes(1);
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
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