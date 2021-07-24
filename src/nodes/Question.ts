import { wrappingInputRule } from "prosemirror-inputrules";
import Node from "./Node";
import toggleWrap from "../commands/toggleWrap";
import isNodeActive from "../queries/isNodeActive";

export default class Question extends Node {
  get name() {
    return "question";
  }

  get schema() {
    return {
      content: "paragraph+",
      group: "block",
      defining: true,
      parseDOM: [{ tag: "div" }],
      // toDOM: () => ["div", 0],
      toDOM: node => {
        const marginNote = document.createElement("aside");
        marginNote.innerText = "Question";
        marginNote.className = "margin-note";
        return [
          "div", 
          {class: "question-container"},
          marginNote,
          ["span", {class: "question"}, 0],
        ];
      },
    };
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*qq\s$/, type)];
  }

  commands({ type }) {
    return () => toggleWrap(type);
  }

  keys({ type }) {
    return {
      "Shift-Ctrl-q": toggleWrap(type),
      "Shift-Enter": (state, dispatch) => {
        if (!isNodeActive(type)(state)) {
          return false;
        }

        const { tr, selection } = state;
        dispatch(tr.split(selection.to));
        return true;
      },
    };
  }

  toMarkdown(state, node) {
    state.wrapBlock("> ", null, node, () => state.renderContent(node));
  }

  parseMarkdown() {
    return { block: "question" };
  }
}
