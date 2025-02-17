import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import styles from './styles/Editor.module.css';
import { defaultExtensions } from './extensions';
import MenuBar from './MenuBar/MenuBar';

interface EditorProps {
    content: string;
    onUpdate?: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, onUpdate }) => {
    const editor = useEditor({
        extensions: defaultExtensions,
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onUpdate?.(html);
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className={styles.editorContainer}>
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className={styles.editorContent} />
        </div>
    );
};

export default Editor;