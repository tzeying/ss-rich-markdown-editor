import { Plugin } from "prosemirror-state";
import copy from "copy-to-clipboard";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node as ProsemirrorNode, NodeType } from "prosemirror-model";
import { textblockTypeInputRule } from "prosemirror-inputrules";
import { setBlockType } from "prosemirror-commands";
import { MarkdownSerializerState } from "prosemirror-markdown";
import backspaceToParagraph from "../commands/backspaceToParagraph";
import toggleBlockType from "../commands/toggleBlockType";
import headingToSlug, { headingToPersistenceKey } from "../lib/headingToSlug";
import Node from "./Node";
import { ToastType } from "../types";

export default class Heading extends Node {
  className = "heading-name";

  get name() {
    return "heading";
  }

  get defaultOptions() {
    return {
      levels: [1, 2, 3, 4],
      collapsed: undefined,
    };
  }

  get schema() {
    return {
      attrs: {
        level: {
          default: 1,
        },
        collapsed: {
          default: undefined,
        },
      },
      content: "inline*",
      group: "block",
      defining: true,
      draggable: false,
      parseDOM: this.options.levels.map(level => ({
        tag: `h${level}`,
        attrs: { level },
        contentElement: "span",
      })),
      toDOM: node => {
        const anchor = document.createElement("button");
        anchor.innerText = "#";
        anchor.type = "button";
        anchor.className = "heading-anchor";
        anchor.contentEditable = "false";
        anchor.addEventListener("click", event => this.handleCopyLink(event));

        const fold = document.createElement("button");
        fold.innerText = "";
        fold.innerHTML =
          '<svg fill="currentColor" width="12" height="24" viewBox="6 0 12 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.23823905,10.6097108 L11.207376,14.4695888 L11.207376,14.4695888 C11.54411,14.907343 12.1719566,14.989236 12.6097108,14.652502 C12.6783439,14.5997073 12.7398293,14.538222 12.792624,14.4695888 L15.761761,10.6097108 L15.761761,10.6097108 C16.0984949,10.1719566 16.0166019,9.54410997 15.5788477,9.20737601 C15.4040391,9.07290785 15.1896811,9 14.969137,9 L9.03086304,9 L9.03086304,9 C8.47857829,9 8.03086304,9.44771525 8.03086304,10 C8.03086304,10.2205442 8.10377089,10.4349022 8.23823905,10.6097108 Z" /></svg>';
        fold.type = "button";
        fold.className = `heading-fold ${
          node.attrs.collapsed ? "collapsed" : ""
        }`;
        fold.contentEditable = "false";
        fold.addEventListener("click", event => this.handleFoldContent(event));

        return [
          `h${node.attrs.level + (this.options.offset || 0)}`,
          [
            "span",
            {
              class: `heading-actions ${
                node.attrs.collapsed ? "collapsed" : ""
              }`,
            },
            anchor,
            fold,
          ],
          [
            "span",
            {
              class: "heading-content",
            },
            0,
          ],
        ];
      },
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: ProsemirrorNode) {
    state.write(state.repeat("#", node.attrs.level) + " ");
    state.renderInline(node);
    state.closeBlock(node);
  }

  parseMarkdown() {
    return {
      block: "heading",
      getAttrs: (token: Record<string, any>) => ({
        level: +token.tag.slice(1),
      }),
    };
  }

  commands({ type, schema }) {
    return (attrs: Record<string, any>) => {
      return toggleBlockType(type, schema.nodes.paragraph, attrs);
    };
  }

  handleFoldContent = event => {
    event.preventDefault();

    const { view } = this.editor;
    const { tr } = view.state;
    const { top, left } = event.target.getBoundingClientRect();
    const result = view.posAtCoords({ top, left });

    if (result) {
      const node = view.state.doc.nodeAt(result.inside);

      if (node) {
        const collapsed = !node.attrs.collapsed;
        const transaction = tr.setNodeMarkup(result.inside, undefined, {
          ...node.attrs,
          collapsed,
        });

        const persistKey = headingToPersistenceKey(node, this.editor.props.id);

        if (collapsed) {
          localStorage?.setItem(persistKey, "collapsed");
        } else {
          localStorage?.removeItem(persistKey);
        }

        view.dispatch(transaction);
      }
    }
  };

  handleCopyLink = event => {
    // this is unfortunate but appears to be the best way to grab the anchor
    // as it's added directly to the dom by a decoration.
    const anchor = event.currentTarget.parentNode.parentNode.previousSibling;
    if (!anchor.className.includes(this.className)) {
      throw new Error("Did not find anchor as previous sibling of heading");
    }
    const hash = `#${anchor.id}`;

    // the existing url might contain a hash already, lets make sure to remove
    // that rather than appending another one.
    const urlWithoutHash = window.location.href.split("#")[0];
    copy(urlWithoutHash + hash);

    if (this.options.onShowToast) {
      this.options.onShowToast(
        this.options.dictionary.linkCopied,
        ToastType.Info
      );
    }
  };

  keys({ type }: { type: NodeType }) {
    const options = this.options.levels.reduce(
      (items, level) => ({
        ...items,
        ...{
          [`Shift-Ctrl-${level}`]: setBlockType(type, { level }),
        },
      }),
      {}
    );

    return {
      ...options,
      Backspace: backspaceToParagraph(type),
    };
  }

  get plugins() {
    const getAnchors = doc => {
      const decorations: Decoration[] = [];
      const previouslySeen = {};

      doc.descendants((node, pos) => {
        if (node.type.name !== this.name) return;

        // calculate the optimal id
        const slug = headingToSlug(node);
        let id = slug;

        // check if we've already used it, and if so how many times?
        // Make the new id based on that number ensuring that we have
        // unique ID's even when headings are identical
        if (previouslySeen[slug] > 0) {
          id = headingToSlug(node, previouslySeen[slug]);
        }

        // record that we've seen this slug for the next loop
        previouslySeen[slug] =
          previouslySeen[slug] !== undefined ? previouslySeen[slug] + 1 : 1;

        decorations.push(
          Decoration.widget(
            pos,
            () => {
              const anchor = document.createElement("a");
              anchor.id = id;
              anchor.className = this.className;
              return anchor;
            },
            {
              side: -1,
              key: id,
            }
          )
        );
      });

      return DecorationSet.create(doc, decorations);
    };

    const plugin = new Plugin({
      state: {
        init: (config, state) => {
          return getAnchors(state.doc);
        },
        apply: (tr, oldState) => {
          return tr.docChanged ? getAnchors(tr.doc) : oldState;
        },
      },
      props: {
        decorations: state => plugin.getState(state),
      },
    });

    return [plugin];
  }

  inputRules({ type }: { type: NodeType }) {
    return this.options.levels.map(level =>
      textblockTypeInputRule(new RegExp(`^(#{1,${level}})\\s$`), type, () => ({
        level,
      }))
    );
  }
}
