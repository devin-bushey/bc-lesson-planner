import React from 'react';
import { Editor } from '@tiptap/react';
import styles from '../styles/MenuBar.module.css';
import { MenuItems } from './MenuItems';

interface MenuBarProps {
    editor: Editor;
    isDisabled?: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor, isDisabled = false }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className={`${styles.menuBar} ${isDisabled ? styles.disabled : ''}`}>
            <MenuItems editor={editor} isDisabled={isDisabled} />
        </div>
    );
};

export default MenuBar;