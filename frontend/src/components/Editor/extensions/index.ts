import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';

export const defaultExtensions = [
    StarterKit,
    Placeholder.configure({
        placeholder: 'Start writing your lesson plan...',
    }),
    Heading.configure({
        levels: [1, 2, 3],
    }),
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    Highlight,
    Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'custom-link',
        },
    }),
    Image,
    Table.configure({
        resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
    Underline,
    Subscript,
    Superscript,
    Color.configure({
        types: ['textStyle']
    }),
    TextStyle,
];