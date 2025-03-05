import JoditEditor, { Jodit } from 'jodit-react';
import PropTypes from 'prop-types';
import React, { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import './JoditEdit.css'


type JoditEditorProps = {
  config?: Record<string, any>;
  id?: string;
  name?: string;
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
  editorRef?: (editor: any) => void | null;
  tabIndex?: number;
  value?: string;
};

const defaultConfig: Record<string, any> = {
  // all options from https://xdsoft.net/jodit/doc/

  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  readonly: false,
  // autofocus: true,
  uploader: {
    insertImageAsBase64URI: true,
    process: (e: any, r: any) => console.log('process--------', e, r),
    prepareData: (e: any, r: any) => console.log('preparData------', e, r),
  },
  // language: 'es',
  // limitChars: appConfig.policyCharacterLimit.maxLimit,
  // enter: 'BR',
  // toolbarStickyOffset: 10,
  showXPathInStatusbar: false,
  // "minHeight": 201,
  //buttons: ["Import"],
  buttons: [
    {
      group: 'font-style',
      buttons: [],
    },
    {
      group: 'script',
      buttons: [],
    },
    {
      group: 'list',
      buttons: ['ul', 'ol'],
    },
    {
      group: 'indent',
      buttons: [],
    },
    {
      group: 'font',
      buttons: [],
    },
    {
      group: 'color',
      buttons: [],
    },
    {
      group: 'media',
      buttons: [],
    },
    {
      group: 'state',
      buttons: [],
    },
    {
      group: 'clipboard',
      buttons: [],
    },
    {
      group: 'insert',
      buttons: [],
    },
    {
      group: 'history',
      buttons: [],
    },
    {
      group: 'search',
      buttons: [],
    },
    '|',
    'fullsize',
  ],
  popup: {
    // @ts-ignore comments in TypeScript
    a: Jodit.atom(Jodit.defaultOptions.popup.a .filter((b : any) => b !== 'file')),
  },
  defaultActionOnPaste: 'insert_as_HTML',
  disablePlugins: 'class-span,media,video,file',
};

const JoditEdit = forwardRef<HTMLTextAreaElement, JoditEditorProps>(
  (props, ref) => {
    const {
      config,
      id,
      name,
      onBlur = (value) => {},
      onChange = (value) => {},
      tabIndex,
      value,
      editorRef,
    } = props;
    const textArea = useRef<null>(null);

    useLayoutEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(textArea.current);
        } else {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textArea.current;
        }
      }
    }, [textArea, ref]);

    useEffect(() => {
      if (textArea.current) {
        if (typeof editorRef === 'function') {
          editorRef(textArea.current);
        }
      }

      return () => {};
    }, [config]);

    return (
      <JoditEditor
        //className=''
        ref={editorRef}
        value={value}
        config={{...defaultConfig, ...config}}
        tabIndex={tabIndex} // tabIndex of textarea
        onBlur={(newContent) => onBlur(newContent)} // preferred to use only this option to update the content for performance reasons
        onChange={(value) => {
          onChange(value);
        }}
      />
    );
  }
);

JoditEdit.propTypes = {
  config: PropTypes.object,
  id: PropTypes.string,
  name: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  editorRef: PropTypes.func,
  tabIndex: PropTypes.number,
  value: PropTypes.string,
};

JoditEdit.defaultProps = {
  config: {},
};

export default JoditEdit;
