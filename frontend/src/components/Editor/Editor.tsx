import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import styles from './styles/Editor.module.css';
import { defaultExtensions } from './extensions';
import MenuBar from './MenuBar/MenuBar';

interface EditorProps {
    content: string;
    onUpdate: (content: string) => void;
    isDisabled?: boolean;
}

const Editor: React.FC<EditorProps> = ({ content, onUpdate, isDisabled = false }) => {
    const editor = useEditor({
        extensions: defaultExtensions,
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onUpdate?.(html);
        },
        editable: !isDisabled,
    });

    // Update editor content when content prop changes
    useEffect(() => {
        if (editor && content) {
            // Only update if the editor content is different
            if (editor.getHTML() !== content) {
                editor.commands.setContent(content);
            }
        }
    }, [editor, content]);

    // Update editor editable state when isDisabled changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!isDisabled);
        }
    }, [editor, isDisabled]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`${styles.editorContainer} ${isDisabled ? styles.disabled : ''}`}>
            <div className={styles.menuBar}>
                <MenuBar editor={editor} isDisabled={isDisabled} />
            </div>
            <div className={styles.editorContent}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default Editor;