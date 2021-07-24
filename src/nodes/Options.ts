import { wrappingInputRule } from "prosemirror-inputrules";
import toggleList from "../commands/toggleList";
import Node from "./Node";

export default class Options extends Node {
  get name() {
    return "options";
  }

  get schema() {
    return {
      content: "list_item+",
      group: "block",
      parseDOM: [{ tag: "ul" }],
      toDOM: () => ["ul", 0],
    };
  }

  commands({ type, schema }) {
    return () => toggleList(type, schema.nodes.list_item);
  }

  keys({ type, schema }) {
    return {
      "Shift-ctrl-o": toggleList(type, schema.nodes.list_item),
      Tab: (state, dispatch) => {
        return false
      },
    };
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*oo\s$/, type)];
  }

  toMarkdown(state, node) {
    state.renderList(node, "  ", () => (node.attrs.bullet || "*") + " ");
  }

  parseMarkdown() {
    return { block: "bullet_list" };
  }
}
