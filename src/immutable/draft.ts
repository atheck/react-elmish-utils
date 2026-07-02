import { current, type Draft } from "immer";

/**
 * Views an immer draft as its plain, writable model type.
 *
 * `react-elmish-utils` operates on unconstrained generic models. immer's `Draft<T>` is a
 * conditional mapped type that TypeScript cannot simplify over such generics, which makes direct
 * draft mutations fail to type check. Because the draft is structurally the model at runtime,
 * mutating it through the plain type is safe and still recorded by immer.
 * @param model The immer draft.
 * @returns The same object typed as the plain model.
 */
function asWritable<TModel>(model: Draft<TModel>): TModel {
	return model as unknown as TModel;
}

/**
 * Creates a plain, detached snapshot of an immer draft.
 * Use this whenever the current model has to leave the `update` function, e.g. when it is passed to
 * a user provided callback or captured by an asynchronous command.
 * @param model The immer draft.
 * @returns A plain snapshot of the current draft state.
 */
function snapshot<TModel>(model: Draft<TModel>): TModel {
	return current(model) as unknown as TModel;
}

export { asWritable, snapshot };
