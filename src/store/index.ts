import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { all } from "redux-saga/effects";
import { notesSaga } from "../features/notes/notesSaga";
import { notesReducer } from "../features/notes/notesSlice";

function* rootSaga() {
  yield all([notesSaga()]);
}

export function makeStore() {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      notes: notesReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: false,
      }).concat(sagaMiddleware),
  });

  sagaMiddleware.run(rootSaga);
  return store;
}

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
