// Simple UI Contract Types

export type MessageDirection = 'in' | 'out';

export interface TextPayload {
    body: string;
}

export interface TextPreviewPayload {
    body: string;
    preview: string;
}

export interface LocationPayload {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
}

export interface Button {
    id: string;
    title: string;
}

export interface InteractiveButtonPayload {
    header?: string;
    body: string;
    footer?: string;
    buttons: Button[];
}

export interface ListRow {
    id: string;
    title: string;
    description?: string;
}

export interface ListSection {
    title?: string;
    rows: ListRow[];
}

export interface InteractiveListPayload {
    header?: string;
    body: string;
    footer?: string;
    buttonText: string;
    sections: ListSection[];
}

export interface InteractiveCTAPayload {
    header?: string;
    body: string;
    footer?: string;
    displayText: string;
    url: string;
}

export type MessageType =
    | 'text'
    | 'text_preview'
    | 'location'
    | 'interactive_button'
    | 'interactive_list'
    | 'interactive_cta';

export interface SimpleUIMessage {
    id: string;
    type: MessageType;
    payload: TextPayload | TextPreviewPayload | LocationPayload | InteractiveButtonPayload | InteractiveListPayload | InteractiveCTAPayload;
}

export interface ChatMessage {
    id: string;
    direction: MessageDirection;
    data: SimpleUIMessage;
    timestamp: Date;
}

// UI Reply Types

export interface TextReply {
    type: 'text';
    payload: {
        body: string;
    };
}

export interface ButtonReply {
    type: 'button_reply';
    contextMessageId: string;
    payload: {
        id: string;
        title: string;
    };
}

export interface ListReply {
    type: 'list_reply';
    contextMessageId: string;
    payload: {
        id: string;
        title: string;
        description?: string;
    };
}

export type UIReply = TextReply | ButtonReply | ListReply;
