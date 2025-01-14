import { ToISOTimeOptions } from 'luxon';

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGEABLE = {page: 1, size: DEFAULT_PAGE_SIZE};
export const rolesList = [
    {
        label      : 'Read',
        value      : 'read',
        description:
            'Can read and clone this repository. Can also open and comment on issues and pull requests.',
    },
    {
        label      : 'Write',
        value      : 'write',
        description:
            'Can read, clone, and push to this repository. Can also manage issues and pull requests.',
    },
    {
        label      : 'Admin',
        value      : 'admin',
        description:
            'Can read, clone, and push to this repository. Can also manage issues, pull requests, and repository settings, including adding collaborators.',
    },
];
export const DEFAULT_DATETIME_TIME_OPTIONS = {
    extendedZone        : false,
    includeOffset       : false,
    suppressMilliseconds: true,
    suppressSeconds     : true
} as ToISOTimeOptions;
export const DEFAULT_QUILL_EDITOR_MODULES = {toolbar: [ [ 'bold', 'italic', 'underline' ], [ 'blockquote', 'code-block' ], [ {header: [ 1, 2, 3, 4, 5, 6, false ]} ], [ {align: []}, {list: 'ordered'}, {list: 'bullet'} ], [ 'clean' ], [ 'link' ] ]};
export const SIMPLE_QUILL_EDITOR_MODULES = {toolbar: [ [ 'bold', 'italic', 'underline' ], [ {align: []}, {list: 'ordered'}, {list: 'bullet'} ], [ 'clean' ], [ 'link' ] ]};
