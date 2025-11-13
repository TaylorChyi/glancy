import { useReducer } from "react";
import {
  createResponseStyleInitialState,
  responseStyleReducer,
} from "../sections/responseStyleModel.js";

export const useResponseStyleReducer = () =>
  useReducer(responseStyleReducer, undefined, createResponseStyleInitialState);

