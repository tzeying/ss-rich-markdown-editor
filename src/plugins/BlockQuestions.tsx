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
                        console.log("A key was pressed!")
                        const serializer = this.editor.serializer
                        let n = view.state.doc;
                        let content = n.content['content']
                        for (const node in content) {
                            console.log(content[node].type.name)
                            if (content[node].type.name == "question") {      
                                console.log(serializer.serialize(content[node]))
                            }
                        }
                        return false // We did not handle this
                    },
                },
            }),
        ];
    }
}
