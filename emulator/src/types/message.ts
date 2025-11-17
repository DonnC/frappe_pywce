// Simple UI Contract Types

export type MessageDirection = 'in' | 'out';

export interface ReadReceiptPayload {
  status: 'read';
  message_id: string;
}

export interface TypingPayload {
  typing_indicator: { type: 'text' };
  message_id: string;
}

export interface ReactionPayload {
  type: 'reaction';
  reaction: {
    emoji: string;
    message_id: string;
  };
}

export interface TextPayload {
  body: string;
}

export interface TextPreviewPayload {
  body: string;
  preview: string;
}

export interface ImagePayload {
  link: string;
  caption?: string;
}

export interface VideoPayload {
  link: string;
  caption?: string;
}

export interface DocumentPayload {
  link: string;
  filename: string;
  caption?: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}

export interface InteractiveLocationRequestPayload {
  header?: string;
  body: string;
  footer?: string;
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
  | 'image'
  | 'video'
  | 'document'
  | 'location' 
  | 'interactive_button' 
  | 'interactive_list' 
  | 'interactive_cta'
  | 'interactive_location_request'
  | 'reaction';

export interface SimpleUIMessage {
  id: string;
  type: MessageType;
  payload: ReadReceiptPayload | TypingPayload | ReactionPayload | TextPayload | TextPreviewPayload | ImagePayload | VideoPayload | DocumentPayload | LocationPayload | InteractiveButtonPayload | InteractiveListPayload | InteractiveCTAPayload | InteractiveLocationRequestPayload;
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

export interface LocationReply {
  type: 'location';
  contextMessageId?: string;
  payload: {
    latitude: number;
    longitude: number;
    name: string;
    address?: string;
  };
}

export interface ImageReply {
  type: 'image';
  payload: {
    link: string;
    caption?: string;
  };
}

export interface VideoReply {
  type: 'video';
  payload: {
    link: string;
    caption?: string;
  };
}

export interface DocumentReply {
  type: 'document';
  payload: {
    link: string;
    filename: string;
    caption?: string;
  };
}

export type UIReply = TextReply | ButtonReply | ListReply | LocationReply | ImageReply | VideoReply | DocumentReply;
