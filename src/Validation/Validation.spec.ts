import { getError, runValidation, type ValidationError, type Validator } from ".";

describe("Validation", () => {
	describe("getError", () => {
		it("finds the correct error", () => {
			// arrange
			const errors: ValidationError[] = [
				{ key: "1st", message: "1st error" },
				{ key: "2nd", message: "2nd error" },
			];

			// act
			const error = getError("2nd", errors);

			// assert
			expect(error).toBe("2nd error");
		});

		it("returns null when without any error", () => {
			// arrange
			const errors: ValidationError[] = [];

			// act
			const error = getError("2nd", errors);

			// assert
			expect(error).toBeNull();
		});

		it("returns null when no error with key exists", () => {
			// arrange
			const errors: ValidationError[] = [
				{ key: "1st", message: "1st error" },
				{ key: "2nd", message: "2nd error" },
			];

			// act
			const error = getError("does not exist", errors);

			// assert
			expect(error).toBeNull();
		});
	});

	describe("runValidation", () => {
		it("returns empty error without validators", async () => {
			// arrange
			const validators: Validator[] = [];

			// act
			const error = await runValidation(...validators);

			// assert
			expect(error).toStrictEqual([]);
		});

		it("runs all validators and filters", async () => {
			// arrange
			const mock1st = jest.fn().mockReturnValue("1st error");
			const mock2nd = jest.fn().mockReturnValue(null);
			const mock3rd = jest.fn().mockReturnValue("3rd error");
			const validators: Validator[] = [
				["1st", mock1st],
				["2nd", mock2nd],
				["3rd", mock3rd],
			];

			// act
			const error = await runValidation(...validators);

			// assert
			expect(mock1st).toHaveBeenCalledTimes(1);
			expect(mock2nd).toHaveBeenCalledTimes(1);
			expect(mock3rd).toHaveBeenCalledTimes(1);
			expect(error).toStrictEqual([
				{ key: "1st", message: "1st error" },
				{ key: "3rd", message: "3rd error" },
			]);
		});
	});
});
