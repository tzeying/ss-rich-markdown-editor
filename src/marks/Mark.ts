import Extension from "../lib/Extension";

export default class Mark extends Extension {
  get type() {
    return "mark";
  }

  get schema(): Record<string, any> {
    return null;
  }

  get markdownToken(): string {
    return "";
  }

  get toMarkdown(): Record<string, any> {
    return {};
  }

  parseMarkdown() {
    return {};
  }

  command() {
    return () => {
      //
    };
  }
}