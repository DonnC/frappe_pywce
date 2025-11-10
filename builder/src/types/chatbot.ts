export type TemplateType = 
  | 'text'
  | 'button'
  | 'cta'
  | 'list'
  | 'flow'
  | 'catalog'
  | 'product'
  | 'multi-product'
  | 'media'
  | 'location'
  | 'request-location'
  | 'template'
  | 'dynamic';

export type HookType = 'template' | 'on-receive' | 'on-generate' | 'middleware' | 'router';

export interface RouteConfig {
  id: string;
  pattern: string;
  isRegex: boolean;
  connectedTo?: string;
}

export interface HookConfig {
  type: HookType;
  path: string;
  params?: Record<string, any>;
}

export interface TemplateSettings {
  ack?: boolean;
  authenticated?: boolean;
  checkpoint?: boolean;
  prop?: string;
  session?: boolean;
  typing?: boolean;
  replyMsgId?: string;
  params?: Record<string, any>;
  isStart?: boolean;
  isReport?: boolean;
  trigger?: string;
}

export interface InteractiveMessage {
  body: string;
  title?: string;
  footer?: string;
}

export interface ButtonMessage extends InteractiveMessage {
  buttons: string[];
}

export interface CtaMessage extends InteractiveMessage {
  url: string;
  button: string;
}

export interface ListRow {
  id: string;
  title: string;
  desc?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListMessage extends InteractiveMessage {
  button: string;
  sections: ListSection[];
}

export interface FlowMessage extends InteractiveMessage {
  id: string;
  name: string;
  button: string;
  token?: string;
  draft?: boolean;
}

export interface ProductSection {
  title: string;
  products: string[];
}

export interface MultiProductMessage extends InteractiveMessage {
  catalogId: string;
  sections: ProductSection[];
}

export interface CatalogMessage extends InteractiveMessage {
  productId?: string;
}

export interface LocationMessage {
  lat: number;
  lon: number;
  name?: string;
  address?: string;
}

export interface MediaMessage {
  type: 'image' | 'video' | 'audio' | 'document';
  mediaId?: string;
  url?: string;
  caption?: string;
  filename?: string;
}

export interface TemplateMessage {
  name: string;
  language?: string;
}

export type MessageConfig = 
  | string
  | ButtonMessage
  | CtaMessage
  | ListMessage
  | FlowMessage
  | MultiProductMessage
  | CatalogMessage
  | LocationMessage
  | MediaMessage
  | TemplateMessage;

export interface ChatbotTemplate {
  id: string;
  name: string;
  type: TemplateType;
  message: MessageConfig;
  routes: RouteConfig[];
  hooks?: HookConfig[];
  settings?: TemplateSettings;
  position?: { x: number; y: number };
  parentId?: string; // For subflow grouping
  handleOrientation?: 'vertical' | 'horizontal'; // Default is vertical (top-bottom)
}

export interface ChatbotFlow {
  templates: ChatbotTemplate[];
  version?: string;
}
