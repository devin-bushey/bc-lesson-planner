import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import styles from './styles/Editor.module.css';
import { defaultExtensions } from './extensions';
import MenuBar from './MenuBar/MenuBar';

interface EditorProps {
    content: string;
    onUpdate: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, onUpdate }) => {
    const editor = useEditor({
        extensions: defaultExtensions,
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onUpdate?.(html);
        },
    }, []);  // Initialize only once

    // Update editor content when content prop changes
    useEffect(() => {
        if (editor && content) {
            // Only update if the editor content is different
            if (editor.getHTML() !== content) {
                editor.commands.setContent(content);
            }
        }
    }, [editor, content]);

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