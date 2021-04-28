import * as Validation from "../../src/Validation";

describe("Validation", () => {
    describe("getError", () => {
        it("finds the correct error", () => {
            // arrange
            const errors: Validation.IValidationError [] = [
                { key: "1st", message: "1st error" },
                { key: "2nd", message: "2nd error" },
            ];

            // act
            const error = Validation.getError("2nd", errors);

             // assert
             expect(error).toEqual("2nd error");
        });

        it("returns null when without any error", () => {
            // arrange
            const errors: Validation.IValidationError [] = [];

            // act
            const error = Validation.getError("2nd", errors);

             // assert
             expect(error).toBeNull();
        });

        it("returns null when no error with key exists", () => {
            // arrange
            const errors: Validation.IValidationError [] = [
                { key: "1st", message: "1st error" },
                { key: "2nd", message: "2nd error" },
            ];

            // act
            const error = Validation.getError("does not exist", errors);

             // assert
             expect(error).toBeNull();
        });
    });

    describe("runValidation", () => {
        it("returns empty error without validators", () => {
            // arrange
            const validators: Validation.Validator [] = [];

            // act
            const error = Validation.runValidation(...validators);

             // assert
             expect(error).toEqual([]);
        });

        it("runs all validators and filters ", () => {
            // arrange
            const mock1st = jest.fn().mockReturnValue("1st error");
            const mock2nd = jest.fn().mockReturnValue(null);
            const mock3rd = jest.fn().mockReturnValue("3rd error");
            const validators: Validation.Validator [] = [
                ["1st", mock1st],
                ["2nd", mock2nd],
                ["3rd", mock3rd],
            ];

            // act
            const error = Validation.runValidation(...validators);

             // assert
             expect(mock1st).toHaveBeenCalledTimes(1);
             expect(mock2nd).toHaveBeenCalledTimes(1);
             expect(mock3rd).toHaveBeenCalledTimes(1);
             expect(error).toEqual([{ key: "1st", message: "1st error" }, { key: "3rd", message: "3rd error" }]);
        });
    });
});