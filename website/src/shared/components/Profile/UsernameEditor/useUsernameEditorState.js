import { useReducer } from "react";
import {
  createUsernameEditorInitialState,
  usernameEditorReducer,
} from "./usernameEditorState.js";

export const useUsernameEditorState = (username) =>
  useReducer(
    usernameEditorReducer,
    username ?? "",
    createUsernameEditorInitialState,
  );
