import { Plugin } from "prosemirror-state";
import Extension from "../lib/Extension";

export default class Keys extends Extension {

    
    get name() {
        return "keys";
    }
    
    get plugins() {
        return [
            new Plugin({
                props: {
                    handleKeyDown: (view, event) => {
                        const serializer = this.editor.serializer
                        let n = view.state.doc;
                        let content = n.content['content']
                        for (const node in content) {
                            console.log(content[node].type.name)
                            console.log(serializer.serialize(content[node]))
                            if (content[node].type.name == "question") {      
                            }
                        }
                        return false // We did not handle this
                    },
                },
            }),
        ];
    }
}
