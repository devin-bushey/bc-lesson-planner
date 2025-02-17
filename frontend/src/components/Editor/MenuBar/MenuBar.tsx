import React from 'react';
import { Editor } from '@tiptap/react';
import styles from '../styles/MenuBar.module.css';
import { MenuItems } from './MenuItems';

interface MenuBarProps {
    editor: Editor;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className={styles.menuBar}>
            <MenuItems editor={editor} />
        </div>
    );
};

export default MenuBar;