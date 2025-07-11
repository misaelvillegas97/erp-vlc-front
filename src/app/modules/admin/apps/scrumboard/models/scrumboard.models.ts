import { IAttachment, IBoard, ICard, IChecklist, IChecklistItem, IComment, ICustomField, ILabel, IList, IMember, } from '@modules/admin/apps/scrumboard/models/scrumboard.types';

// -----------------------------------------------------------------------------------------------------
// @ Board
// -----------------------------------------------------------------------------------------------------
export class Board implements Required<IBoard> {
    id: string | null;
    title: string;
    description: string | null;
    icon: string | null;
    lastActivity: string | null;
    lists: List[];
    labels: Label[];
    members: Member[];

    /**
     * Constructor
     */
    constructor(board: IBoard) {
        this.id = board.id || null;
        this.title = board.title;
        this.description = board.description || null;
        this.icon = board.icon || null;
        this.lastActivity = board.lastActivity || null;
        this.lists = [];
        this.labels = [];
        this.members = [];

        // Lists
        if (board.lists) {
            this.lists = board.lists.map((list) => {
                if (!(list instanceof List)) {
                    return new List(list);
                }

                return list;
            });
        }

        // Labels
        if (board.labels) {
            this.labels = board.labels.map((label) => {
                if (!(label instanceof Label)) {
                    return new Label(label);
                }

                return label;
            });
        }

        // Members
        if (board.members) {
            this.members = board.members.map((member) => {
                if (!(member instanceof Member)) {
                    return new Member(member);
                }

                return member;
            });
        }
    }
}

// -----------------------------------------------------------------------------------------------------
// @ List
// -----------------------------------------------------------------------------------------------------
export class List implements Required<IList> {
    id: string | null;
    boardId: string;
    position: number;
    title: string;
    icon: string | null;
    color: string | null;
    cards: Card[];

    /**
     * Constructor
     */
    constructor(list: IList) {
        this.id = list.id || null;
        this.boardId = list.boardId;
        this.position = list.position;
        this.title = list.title;
        this.icon = list.icon || null;
        this.color = list.color || null;
        this.cards = [];

        // Cards
        if (list.cards) {
            this.cards = list.cards.map((card) => {
                if (!(card instanceof Card)) {
                    return new Card(card);
                }

                return card;
            });
        }
    }
}

// -----------------------------------------------------------------------------------------------------
// @ Card
// -----------------------------------------------------------------------------------------------------
export class Card implements Required<ICard> {
    id: string | null;
    boardId: string;
    listId: string;
    position: number;
    title: string;
    description: string | null;
    labels: Label[];
    assignees: Member[];
    dueDate: string | null;
    coverImage: string | null;
    checklists: Checklist[];
    comments: Comment[];
    attachments: Attachment[];
    customFields: CustomField[];
    type: string | null;

    /**
     * Constructor
     */
    constructor(card: ICard) {
        this.id = card.id || null;
        this.boardId = card.boardId;
        this.listId = card.listId;
        this.position = card.position;
        this.title = card.title;
        this.description = card.description || null;
        this.labels = [];
        this.assignees = [];
        this.dueDate = card.dueDate || null;
        this.coverImage = card.coverImage || null;
        this.checklists = [];
        this.comments = [];
        this.attachments = [];
        this.customFields = [];
        this.type = card.type || null;

        // Labels
        if (card.labels) {
            this.labels = card.labels.map((label) => {
                if (!(label instanceof Label)) {
                    return new Label(label);
                }

                return label;
            });
        }

        // Assignees
        if (card.assignees) {
            this.assignees = card.assignees.map((assignee) => {
                if (!(assignee instanceof Member)) {
                    return new Member(assignee);
                }

                return assignee;
            });
        }

        // Checklists
        if (card.checklists) {
            this.checklists = card.checklists.map((checklist) => {
                if (!(checklist instanceof Checklist)) {
                    return new Checklist(checklist);
                }

                return checklist;
            });
        }

        // Comments
        if (card.comments) {
            this.comments = card.comments.map((comment) => {
                if (!(comment instanceof Comment)) {
                    return new Comment(comment);
                }

                return comment;
            });
        }

        // Attachments
        if (card.attachments) {
            this.attachments = card.attachments.map((attachment) => {
                if (!(attachment instanceof Attachment)) {
                    return new Attachment(attachment);
                }

                return attachment;
            });
        }

        // Custom fields
        if (card.customFields) {
            this.customFields = card.customFields.map((field) => {
                if (!(field instanceof CustomField)) {
                    return new CustomField(field);
                }

                return field;
            });
        }
    }
}

// -----------------------------------------------------------------------------------------------------
// @ Member
// -----------------------------------------------------------------------------------------------------
export class Member implements IMember {
    id: string;
    name: string;
    avatar?: any;
    position?: string;

    // internal use only
    deletable?: boolean;

    constructor(member: IMember) {
        this.id = member.id;
        this.name = member.name;
        this.avatar = member.avatar || null;
        this.position = member.position || null;
    }
}

// -----------------------------------------------------------------------------------------------------
// @ Label
// -----------------------------------------------------------------------------------------------------
export class Label implements Required<ILabel> {
    id: string | null;
    boardId: string;
    title: string;
    color: string | null;

    // internal use only
    deletable?: boolean;

    /**
     * Constructor
     */
    constructor(label: ILabel) {
        this.id = label.id || null;
        this.boardId = label.boardId;
        this.title = label.title;
        this.color = label.color || null;
    }
}

// -----------------------------------------------------------------------------------------------------
// @ Checklist
// -----------------------------------------------------------------------------------------------------
export class Checklist implements Required<IChecklist> {
    id: string | null;
    cardId: string;
    title: string;
    items: ChecklistItem[];

    /**
     * Constructor
     */
    constructor(checklist: IChecklist) {
        this.id = checklist.id || null;
        this.cardId = checklist.cardId;
        this.title = checklist.title;
        this.items = [];

        // Items
        if (checklist.items) {
            this.items = checklist.items.map((item) => {
                if (!(item instanceof ChecklistItem)) {
                    return new ChecklistItem(item);
                }

                return item;
            });
        }
    }
}

// -----------------------------------------------------------------------------------------------------
// @ ChecklistItem
// -----------------------------------------------------------------------------------------------------
export class ChecklistItem implements Required<IChecklistItem> {
    id: string | null;
    checklistId: string;
    title: string;
    checked: boolean;

    /**
     * Constructor
     */
    constructor(item: IChecklistItem) {
        this.id = item.id || null;
        this.checklistId = item.checklistId;
        this.title = item.title;
        this.checked = item.checked;
    }
}

// -----------------------------------------------------------------------------------------------------
// @ Comment
// -----------------------------------------------------------------------------------------------------
export class Comment implements Required<IComment> {
    id: string | null;
    cardId: string;
    memberId: string;
    member: Member | null;
    message: string;
    createdAt: string;

    /**
     * Constructor
     */
    constructor(comment: IComment) {
        this.id = comment.id || null;
        this.cardId = comment.cardId;
        this.memberId = comment.memberId;
        this.message = comment.message;
        this.createdAt = comment.createdAt;
        this.member = null;

        // Member
        if (comment.member) {
            this.member = new Member(comment.member);
        }
    }
}

// -----------------------------------------------------------------------------------------------------
// @ Attachment
// -----------------------------------------------------------------------------------------------------
export class Attachment implements Required<IAttachment> {
    id: string | null;
    cardId: string;
    name: string;
    url: string;
    type: string;
    size: number | null;
    createdAt: string;

    /**
     * Constructor
     */
    constructor(attachment: IAttachment) {
        this.id = attachment.id || null;
        this.cardId = attachment.cardId;
        this.name = attachment.name;
        this.url = attachment.url;
        this.type = attachment.type;
        this.size = attachment.size || null;
        this.createdAt = attachment.createdAt;
    }
}

// -----------------------------------------------------------------------------------------------------
// @ CustomField
// -----------------------------------------------------------------------------------------------------
export class CustomField implements Required<ICustomField> {
    id: string | null;
    cardId: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiuser';
    title: string;
    value: any;
    options: { id: string; value: string }[] | null;

    /**
     * Constructor
     */
    constructor(field: ICustomField) {
        this.id = field.id || null;
        this.cardId = field.cardId;
        this.type = field.type;
        this.title = field.title;
        this.value = field.value || null;
        this.options = field.options || null;
    }
}
