import { Button } from './ui/button';
import {
    MessageSquare,
    MapPin,
    List,
    ToggleLeft,
    ExternalLink,
    Link as LinkIcon,
    Trash2
} from 'lucide-react';
import { SimpleUIMessage } from '@/types/message';

interface DemoToolbarProps {
    onAddMessage: (message: SimpleUIMessage) => void;
    onClear: () => void;
}

export const DemoToolbar = ({ onAddMessage, onClear }: DemoToolbarProps) => {
    const demoMessages: Record<string, SimpleUIMessage> = {
        text: {
            id: `demo-${Date.now()}-1`,
            type: 'text',
            payload: { body: 'Hello! This is a simple text message.' },
        },
        textPreview: {
            id: `demo-${Date.now()}-2`,
            type: 'text_preview',
            payload: {
                body: 'Check out this link: https://www.google.com',
                preview: 'google.com',
            },
        },
        location: {
            id: `demo-${Date.now()}-3`,
            type: 'location',
            payload: {
                latitude: -17.8216,
                longitude: 31.0492,
                name: 'Harare, Zimbabwe',
                address: 'Capital City of Zimbabwe',
            },
        },
        button: {
            id: `demo-${Date.now()}-4`,
            type: 'interactive_button',
            payload: {
                header: 'Choose an Option',
                body: 'Please select one of the buttons below to continue.',
                footer: 'Powered by WhatsApp',
                buttons: [
                    { id: 'btn-1', title: 'Option 1' },
                    { id: 'btn-2', title: 'Option 2' },
                    { id: 'btn-3', title: 'Option 3' },
                ],
            },
        },
        list: {
            id: `demo-${Date.now()}-5`,
            type: 'interactive_list',
            payload: {
                header: 'Main Menu',
                body: 'Please select an option from the list.',
                footer: 'Tap the button below',
                buttonText: 'View Options',
                sections: [
                    {
                        title: 'Section 1',
                        rows: [
                            { id: 'row-1', title: 'Option A', description: 'Description for A' },
                            { id: 'row-2', title: 'Option B', description: 'Description for B' },
                        ],
                    },
                    {
                        title: 'Section 2',
                        rows: [
                            { id: 'row-3', title: 'Option C', description: 'Description for C' },
                            { id: 'row-4', title: 'Option D', description: 'Description for D' },
                        ],
                    },
                ],
            },
        },
        cta: {
            id: `demo-${Date.now()}-6`,
            type: 'interactive_cta',
            payload: {
                header: 'Visit Our Website',
                body: 'Click the button below to learn more about our services.',
                footer: 'Thank you!',
                displayText: 'Visit Site',
                url: 'https://www.google.com',
            },
        },
    };

    return (
        <div className="border-t bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Demo Toolbar</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClear}
                    className="text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddMessage(demoMessages.text)}
                    className="justify-start"
                >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Text
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddMessage(demoMessages.textPreview)}
                    className="justify-start"
                >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Preview
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddMessage(demoMessages.location)}
                    className="justify-start"
                >
                    <MapPin className="w-4 h-4 mr-2" />
                    Location
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddMessage(demoMessages.button)}
                    className="justify-start"
                >
                    <ToggleLeft className="w-4 h-4 mr-2" />
                    Buttons
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddMessage(demoMessages.list)}
                    className="justify-start"
                >
                    <List className="w-4 h-4 mr-2" />
                    List
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddMessage(demoMessages.cta)}
                    className="justify-start"
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    CTA URL
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                These buttons add demo messages to test the UI without the bridge server.
            </p>
        </div>
    );
};
