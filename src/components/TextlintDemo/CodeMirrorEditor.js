// LICENSE : MIT
"use strict";
import {dom, element} from 'decca'
import CodeMirror from "codemirror"
const mirrorMap = {};
function mutateAfterMount(path, props) {
    return () => {
        var textarea = document.getElementById(path);
        var cm = CodeMirror.fromTextArea(textarea);
        updateCmState(cm, props);
        mirrorMap[path] = cm;
        if (typeof props["onChange"] === "function") {
            cm.on('change', props["onChange"]);
        }
        if (typeof props.defaultValue === "string") {
            cm.setValue(props.defaultValue);
        }
    };
}
function updateCmState(cm, nextProps) {
    if (typeof nextProps.value === "string") {
        const currentValue = cm.getValue();
        if (currentValue !== nextProps.value) {
            cm.setValue(nextProps.value);
        }
    }
    // options
    if (typeof nextProps.options === 'object') {
        Object.keys(nextProps.options).forEach(optionName => {
            if (nextProps.options.hasOwnProperty(optionName)) {
                cm.setOption(optionName, nextProps.options[optionName]);
            }
        });
    }
}
const CodeMirrorEditor = {
    onCreate({path, props}){
        requestAnimationFrame(mutateAfterMount(path, props));
    },
    onUpdate({props, path}){
        const cm = mirrorMap[path];
        if (cm) {
            updateCmState(cm, props);
        }
    },
    onRemove({path}){
        const cm = mirrorMap[path];
        if (cm) {
            cm.toTextArea();
            mirrorMap[path] = null;
        }
    },
    render({path}){
        return <div class="CodeMirrorEditor">
            <textarea class="CodeMirrorEditor-textarea" style="display:none;" id={path}></textarea>
        </div>
    }
};

export default CodeMirrorEditor;
