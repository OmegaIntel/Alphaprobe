import React, { useRef, useState } from "react";
import JoditEdit from "../DocumentEditor/JoditEdit";

type DocumentEditorPros = {
    content : string
}

const DocumentEdit : React.FC<DocumentEditorPros> = (props) =>{
    const editor = useRef(null);
    const editorRef = useRef(null);
    const [value, setValue] = useState<string>(props.content || '')

    return(<JoditEdit
        ref={editor}
        editorRef={(ref) =>{ editorRef.current = ref}}
        config={{
            toolbar: false,
			readonly:true,
			showCharsCounter: false,
		    showWordsCounter: false,
			showXPathInStatusbar: false,
        }}
        tabIndex={1}
        value={value}
        onChange={(value :string)=>{
           setValue(value)
        }}
     />)

}

export default DocumentEdit