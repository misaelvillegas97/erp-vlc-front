export interface IBoard {
    id?: string | null;
    title: string;
    description?: string | null;
    icon?: string | null;
    lastActivity?: string | null;
    lists?: IList[];
    labels?: ILabel[];
    members?: IMember[];
}

export interface IList {
    id?: string | null;
    boardId: string;
    position: number;
    title: string;
    icon?: string | null;
    color?: string | null;
    cards?: ICard[];
}

export interface ICard {
    id?: string | null;
    boardId: string;
    listId: string;
    position: number;
    title: string;
    description?: string | null;
    labels?: ILabel[];
    assignees?: IMember[];
    dueDate?: string | null;
    coverImage?: string | null;
    checklists?: IChecklist[];
    comments?: IComment[];
    attachments?: IAttachment[];
    customFields?: ICustomField[];
    type?: string | null;
}

export interface IMember {
    id?: string;
    name: string;
    avatar?: string;
    position?: string;
}

export interface ILabel {
    id: string | null;
    boardId: string;
    title: string;
    color?: string | null;
}

export interface IChecklist {
    id?: string | null;
    cardId: string;
    title: string;
    items?: IChecklistItem[];
}

export interface IChecklistItem {
    id?: string | null;
    checklistId: string;
    title: string;
    checked: boolean;
}

export interface IComment {
    id?: string | null;
    cardId: string;
    memberId: string;
    member?: IMember;
    message: string;
    createdAt: string;
}

export interface IAttachment {
    id?: string | null;
    cardId: string;
    name: string;
    url: string;
    type: string;
    size?: number;
    createdAt: string;
}

export interface ICustomField {
    id?: string | null;
    cardId: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiuser';
    title: string;
    value?: any;
    options?: { id: string; value: string }[];
}
