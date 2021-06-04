import * as Form from "../../src/Form/Form";
import * as ElmTesting from "react-elmish/dist/Testing";
import * as TypeMoq from "typemoq";

describe("FormScreen", () => {
    describe("update", () => {
        describe("ReValidate", () => {
            it("does nothing when not validated", () => {
                // arrange
                const model = TypeMoq.Mock.ofType<Form.Model>();
                const props = TypeMoq.Mock.ofType<Form.Props<number>>();
                const options = {
                    validate: jest.fn(),
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

            it("calls the validation and saves the errors when already validated", () => {
                // arrange
                const model = TypeMoq.Mock.ofType<Form.Model>();
                const props = TypeMoq.Mock.ofType<Form.Props<number>>();
                const validationResult = [{ key: "key", message: "message" }];
                const validate = jest.fn().mockReturnValue(validationResult);
                const options = {
                    validate,
                    getData: jest.fn(),
                };
                const form = Form.createForm(options);
                const msg = form.Msg.reValidate();

                model.setup(m => m.validated).returns(() => true);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(validate).toBeCalledTimes(1);
                expect(validate).toBeCalledWith(model.object, props.object);

                expect(newModel).toEqual({ ...model.object, errors: validationResult });
                expect(cmd).toBeUndefined();
            });
        });

        describe("Accept", () => {
            it("it validates, calls getData and onAccept without validation errors", () => {
                // arrange
                const validate = jest.fn().mockReturnValue([]);
                const getData = jest.fn().mockReturnValue(42);
                const options = {
                    validate,
                    getData,
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.accept());
                const onAccept = jest.fn();

                props.setup(p => p.onAccept).returns(() => onAccept);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(validate).toBeCalledTimes(1);
                expect(validate).toBeCalledWith(model.object, props.object);

                expect(getData).toBeCalledTimes(1);
                expect(onAccept).toBeCalledTimes(1);
                expect(onAccept).toBeCalledWith(42);

                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });

            it("it validates and saves the errors with validation errors", () => {
                // arrange
                const validationErrors = [{ key: "key", message: "message" }];
                const validate = jest.fn().mockReturnValue(validationErrors);
                const getData = jest.fn();
                const options = {
                    validate,
                    getData,
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.accept());
                const onAccept = jest.fn();

                props.setup(p => p.onAccept).returns(() => onAccept);

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(validate).toBeCalledTimes(1);
                expect(validate).toBeCalledWith(model.object, props.object);

                expect(getData).not.toBeCalled();
                expect(onAccept).not.toBeCalled();

                expect(newModel).toEqual({ ...model.object, validated: true, errors: validationErrors });
                expect(cmd).toBeUndefined();
            });
        });

        describe("Cancel", () => {
            it("dispatches Cancel when onCancelRequest not specified", () => {
                // arrange
                const options = {
                    validate: jest.fn(),
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
                    validate: jest.fn(),
                    getData: jest.fn(),
                    onCancelRequest: mockCancelRequest,
                };
                const form = Form.createForm(options);
                const [model, props, msg] = createMocks(form.Msg.cancelRequest());

                // act
                const [newModel, cmd] = form.update(model.object, msg, props.object);

                // assert
                expect(mockCancelRequest).toHaveBeenCalledTimes(1);
                expect(mockCancelRequest).toHaveBeenCalledWith(model.object, props.object);
                expect(newModel).toEqual({});
                expect(cmd).toBeUndefined();
            });
        });

        describe("ExecCancel", () => {
            it("calls onCancel", () => {
                // arrange
                const options = {
                    validate: jest.fn(),
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
    });

    describe("validate", () => {
        it("calls the validate function", () => {
            // arrange
            const validationErrors = [{ key: "key", message: "message" }];
            const validate = jest.fn().mockReturnValue(validationErrors);
            const options = {
                validate,
                getData: jest.fn(),
            };
            const form = Form.createForm(options);
            const [model, props, msg] = createMocks(form.Msg.accept());

            // act
            const [newModel] = form.update(model.object, msg, props.object);

            // assert
            expect(validate).toBeCalledTimes(1);
            expect(validate).toBeCalledWith(model.object, props.object);
            expect(newModel.errors).toEqual(validationErrors);
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