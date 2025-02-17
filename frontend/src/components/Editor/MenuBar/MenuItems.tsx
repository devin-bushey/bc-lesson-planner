import React from 'react';
import { Editor } from '@tiptap/react';
import styles from '../styles/MenuBar.module.css';

interface MenuItemsProps {
    editor: Editor;
}

export const MenuItems: React.FC<MenuItemsProps> = ({ editor }) => (
    <>
        {/* Text Formatting */}
        <div className={styles.menuGroup}>
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? styles.isActive : ''}
                title="Bold (Ctrl+B)"
            >
                <i className="fas fa-bold" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? styles.isActive : ''}
                title="Italic (Ctrl+I)"
            >
                <i className="fas fa-italic" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? styles.isActive : ''}
                title="Underline (Ctrl+U)"
            >
                <i className="fas fa-underline" />
            </button>
        </div>

        {/* Lists and Tasks */}
        <div className={styles.menuGroup}>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? styles.isActive : ''}
                title="Bullet List"
            >
                <i className="fas fa-list-ul" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={editor.isActive('taskList') ? styles.isActive : ''}
                title="Task List"
            >
                <i className="fas fa-tasks" />
            </button>
        </div>

        {/* Text Alignment */}
        <div className={styles.menuGroup}>
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? styles.isActive : ''}
                title="Align Left"
            >
                <i className="fas fa-align-left" />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? styles.isActive : ''}
                title="Align Center"
            >
                <i className="fas fa-align-center" />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? styles.isActive : ''}
                title="Align Right"
            >
                <i className="fas fa-align-right" />
            </button>
        </div>

        {/* Table Controls */}
        <div className={styles.menuGroup}>
            <button
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
                title="Insert Table"
            >
                <i className="fas fa-table" />
            </button>
            <button
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title="Add Column Before"
            >
                <i className="fas fa-plus" />
            </button>
            <button
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Delete Column"
            >
                <i className="fas fa-minus" />
            </button>
        </div>

        {/* Special Formatting */}
        <div className={styles.menuGroup}>
            <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={editor.isActive('highlight') ? styles.isActive : ''}
                title="Highlight"
            >
                <i className="fas fa-highlighter" />
            </button>
            {/* <input
                type="color"
                onChange={e => {
                    editor.chain().focus().setColor(e.target.value).run()
                }}
                value={editor.getAttributes('textStyle').color || '#000000'}
                title="Text Color"
                className={styles.colorPicker}
            /> */}
        </div>
    </>
);