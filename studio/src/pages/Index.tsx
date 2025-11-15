import { useState, useCallback, useRef, useEffect } from "react";
import {
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { ChatbotTemplate, TemplateType, ChatbotFlow } from "@/types/chatbot";
import { TemplateNode } from "@/components/flow/TemplateNode";
import { SubflowNode } from "@/components/flow/SubflowNode";
import { CustomEdge } from "@/components/flow/CustomEdge";
import { Toolbar } from "@/components/flow/Toolbar";
import { PropertiesSidebar } from "@/components/flow/PropertiesSidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Code } from "lucide-react";

const chatbotConfigDocName = "ChatBot Config";

const nodeTypes = {
  template: TemplateNode,
  subflow: SubflowNode,
};

const edgeTypes = {
  default: CustomEdge,
  straight: CustomEdge,
  step: CustomEdge,
  smoothstep: CustomEdge,
};

type ChatBotConfig = {
  name?: string;
  chatbot_name?: string;
  flow_json?: string;
  env?: string; // local, live, test
};

const Index = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<ChatbotTemplate>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ChatbotTemplate | null>(null);
  const [minimapVisible, setMinimapVisible] = useState(true);
  const [edgeType, setEdgeType] = useState<
    "default" | "straight" | "step" | "smoothstep"
  >("default");
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>(
    []
  );
  const [historyIndex, setHistoryIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFlowLoaded, setIsFlowLoaded] = useState(false);

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  const [isSaving, setIsSaving] = useState(false);
  const { data, error, isLoading, isValidating, mutate } =
    useFrappeGetDoc<ChatBotConfig>(chatbotConfigDocName, chatbotConfigDocName);
  const {
    updateDoc,
    loading: updating,
    error: updateError,
  } = useFrappeUpdateDoc<ChatBotConfig>();

  useEffect(() => {
    console.log("ChatBot Config: ", data);
    console.log("ChatBot Config Name: ", data?.chatbot_name);

    if (data && !isFlowLoaded) {
      setIsFlowLoaded(true); 

      if (data.flow_json) {
        let flow: ChatbotFlow;
        try {
          flow =
            typeof data.flow_json === "string"
              ? JSON.parse(data.flow_json)
              : (data.flow_json as unknown as ChatbotFlow);
        } catch (err: any) {
          toast.error("Failed to parse flow_json: " + (err?.message ?? err));
          return;
        }

        const newNodes: Node<ChatbotTemplate>[] = flow.templates.map(
          (template) => ({
            id: template.id,
            type: "template",
            position: template.position || { x: 0, y: 0 },
            data: template,
          })
        );

        const newEdges: Edge[] = [];
        flow.templates.forEach((template) => {
          template.routes?.forEach((route) => {
            if (route.connectedTo) {
              const label = route.pattern
                ? route.isRegex && route.pattern === ".*"
                  ? "any"
                  : route.pattern
                : "";

              newEdges.push({
                id: `e${template.id}-${route.id}-${route.connectedTo}`,
                source: template.id,
                sourceHandle: route.id,
                target: route.connectedTo,
                type: edgeType,
                animated: true,
                label,
                data: { isRegex: route.isRegex, edgeType },
              });
            }
          });
        });

        setNodes(newNodes);
        setEdges(newEdges);
        saveToHistory();

        const botName = data.chatbot_name ?? "untitled";
        toast.success(`ChatBot flow "${botName}" loaded`);
      } else {
        toast.info(
          `New flow for "${data.chatbot_name ?? "untitled"}". Start building!`
        );
        setNodes([]);
        setEdges([]);
        saveToHistory();
      }
    } else if (!data && !isLoading && !isFlowLoaded) {
      setIsFlowLoaded(true);
      toast.info(`Create a new chatbot to continue`);
      setNodes([]);
      setEdges([]);
      saveToHistory();
    }
  }, [
    data,
    isLoading,
    isFlowLoaded,
    edgeType,
    setNodes,
    setEdges,
    saveToHistory,
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceHandle = params.sourceHandle || "default";

      // Find source and target nodes to determine handle positions
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      // Determine source and target positions based on handleOrientation
      const sourceOrientation =
        sourceNode?.data?.handleOrientation || "vertical";
      const targetOrientation =
        targetNode?.data?.handleOrientation || "vertical";

      const sourcePosition =
        sourceOrientation === "horizontal" ? "right" : "bottom";
      const targetPosition =
        targetOrientation === "horizontal" ? "left" : "top";

      // Find the route to get its pattern for the label
      let routePattern = "";
      let isRegex = false;
      if (sourceNode) {
        const template = sourceNode.data as ChatbotTemplate;
        const route = template.routes?.find((r) => r.id === sourceHandle);
        if (route) {
          routePattern = route.pattern;
          isRegex = route.isRegex;
        }
      }

      // Create label for edge
      const label = routePattern
        ? isRegex && routePattern === ".*"
          ? "any"
          : routePattern
        : "";

      const edge = {
        ...params,
        sourceHandle,
        targetHandle: params.targetHandle,
        id: `e${params.source}-${sourceHandle}-${params.target}`,
        type: edgeType,
        animated: true,
        label,
        data: { isRegex, edgeType },
      };
      setEdges((eds) => addEdge(edge, eds));

      // Update the route's connectedTo field
      if (params.source && params.target) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.source) {
              const template = node.data as ChatbotTemplate;
              const routes = template.routes || [];

              // If connecting from default handle and no routes exist, create a route
              if (sourceHandle === "default" && routes.length === 0) {
                const newRoute = {
                  id: `route-${Date.now()}`,
                  pattern: "",
                  isRegex: false,
                  connectedTo: params.target,
                  sourcePosition: "bottom" as const,
                  targetPosition: "top" as const,
                };
                return {
                  ...node,
                  data: {
                    ...template,
                    routes: [newRoute],
                  },
                };
              }

              // Update existing route
              const updatedRoutes = routes.map((route) => {
                if (route.id === sourceHandle) {
                  return { ...route, connectedTo: params.target };
                }
                return route;
              });

              return {
                ...node,
                data: {
                  ...template,
                  routes: updatedRoutes,
                },
              };
            }
            return node;
          })
        );
      }

      saveToHistory();
    },
    [setEdges, setNodes, saveToHistory, edgeType, nodes]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => {
        // Clear the connectedTo field for the corresponding route
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === edge.source) {
              const template = node.data as ChatbotTemplate;
              const routes = template.routes || [];
              const updatedRoutes = routes.map((route) => {
                if (route.id === edge.sourceHandle) {
                  return { ...route, connectedTo: undefined };
                }
                return route;
              });
              return {
                ...node,
                data: {
                  ...template,
                  routes: updatedRoutes,
                },
              };
            }
            return node;
          })
        );
      });
      saveToHistory();
    },
    [setNodes, saveToHistory]
  );

  const onNodeClick = useCallback((_: never, node: Node<ChatbotTemplate>) => {
    setSelectedTemplate(node.data);
  }, []);

  const addTemplate = useCallback(
    (type: TemplateType) => {
      const id = `${type}-${Date.now()}`;
      const newTemplate: ChatbotTemplate = {
        id,
        name: id,
        type,
        message: type === "text" ? "" : { body: "", title: "", footer: "" },
        routes: [],
      };

      const newNode: Node<ChatbotTemplate> = {
        id,
        type: "template",
        position: { x: Math.random() * 500, y: Math.random() * 500 },
        data: newTemplate,
      };

      setNodes((nds) => [...nds, newNode]);
      saveToHistory();
      toast.success(`Added ${type} template`);
    },
    [setNodes, saveToHistory]
  );

  const updateTemplate = useCallback(
    (template: ChatbotTemplate) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === template.id ? { ...node, data: template } : node
        )
      );
      setSelectedTemplate(template);
      saveToHistory();
    },
    [setNodes, saveToHistory]
  );

  const deleteTemplate = useCallback(() => {
    if (!selectedTemplate) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedTemplate.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedTemplate.id &&
          edge.target !== selectedTemplate.id
      )
    );
    setSelectedTemplate(null);
    saveToHistory();
    toast.success("Template deleted");
  }, [selectedTemplate, setNodes, setEdges, saveToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const exportFlow = useCallback(() => {
    const flow: ChatbotFlow = {
      templates: nodes.map((node) => ({
        ...node.data,
        position: node.position,
      })),
      version: "1.0",
    };

    const json = JSON.stringify(flow, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chatbot-flow.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Flow exported successfully");
  }, [nodes]);

  const importFlow = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const flow: ChatbotFlow = JSON.parse(e.target?.result as string);

          const newNodes: Node<ChatbotTemplate>[] = flow.templates.map(
            (template) => ({
              id: template.id,
              type: "template",
              position: template.position || { x: 0, y: 0 },
              data: template,
            })
          );

          // Reconstruct edges from route connections
          const newEdges: Edge[] = [];
          flow.templates.forEach((template) => {
            template.routes?.forEach((route) => {
              if (route.connectedTo) {
                const label = route.pattern
                  ? route.isRegex && route.pattern === ".*"
                    ? "any"
                    : route.pattern
                  : "";

                newEdges.push({
                  id: `e${template.id}-${route.id}-${route.connectedTo}`,
                  source: template.id,
                  sourceHandle: route.id,
                  target: route.connectedTo,
                  type: edgeType,
                  animated: true,
                  label,
                  data: { isRegex: route.isRegex, edgeType },
                });
              }
            });
          });

          setNodes(newNodes);
          setEdges(newEdges);
          saveToHistory();
          toast.success("Flow imported successfully");
        } catch (error) {
          toast.error("Failed to import flow");
        }
      };
      reader.readAsText(file);
    },
    [setNodes, setEdges, saveToHistory, edgeType]
  );

  const autoLayout = useCallback(() => {
    // Simple auto-layout algorithm
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 3) * 300,
        y: Math.floor(index / 3) * 200,
      },
    }));
    setNodes(layoutedNodes);
    saveToHistory();
    toast.success("Auto-layout applied");
  }, [nodes, setNodes, saveToHistory]);

  const toggleEdgeType = useCallback(() => {
    const types: Array<"default" | "straight" | "step" | "smoothstep"> = [
      "default",
      "straight",
      "step",
      "smoothstep",
    ];
    const currentIndex = types.indexOf(edgeType);
    const newType = types[(currentIndex + 1) % types.length];
    setEdgeType(newType);

    // Update all existing edges to new type
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        type: newType,
        data: { ...edge.data, edgeType: newType },
      }))
    );

    toast.success(`Switched to ${newType} edges`);
  }, [edgeType, setEdges]);

  // TODO: handle versions properly
  const getCurrentFlowJson = () => {
    const flow: ChatbotFlow = {
      templates: nodes.map((node) => ({
        ...node.data,
        position: node.position,
      })),
      version: "1.0",
    };
    return JSON.stringify(flow, null, 2);
  };

  const saveCurrentFlowJson = () => {
    setIsSaving(true);
    const flowJson = getCurrentFlowJson();

    console.log("Saving flow JSON: ", flowJson);

    updateDoc(chatbotConfigDocName, chatbotConfigDocName, {
      flow_json: flowJson,
    })
      .then(async () => {
        toast.success("Flow saved!");
        await mutate();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to save flow.");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const previewCurrentFlowJson = () => {
    toast.info("Saving flow before preview...");
    saveCurrentFlowJson();

    if (data?.env != "local") {
      toast.warning("Only local environment can run on Emulator");
    } else {
      window.open(`/emulator`, "_blank");
    }
  };

  const FetchingComponent = () => {
    const { data } = useFrappeGetCall("ping");

    return <div>Ping: {data?.message}</div>;
  };

  return (
    <div className="h-screen w-screen flex">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileImport}
      />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={["Backspace", "Delete"]}
          edgesFocusable
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          {minimapVisible && (
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-background border rounded-lg"
            />
          )}

          <Toolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAutoLayout={autoLayout}
            onToggleMinimap={() => setMinimapVisible(!minimapVisible)}
            onExport={exportFlow}
            onImport={importFlow}
            onAddTemplate={addTemplate}
            onToggleEdgeType={toggleEdgeType}
            onSave={saveCurrentFlowJson}
            onPreview={previewCurrentFlowJson}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            minimapVisible={minimapVisible}
            edgeType={edgeType}
          />

          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <Button onClick={() => setShowJsonDialog(true)}>
              <Code className="h-4 w-4 mr-2" />
              Show Flow JSON
            </Button>

            {/* <FetchingComponent /> */}
          </div>
        </ReactFlow>
      </div>

      {selectedTemplate && (
        <PropertiesSidebar
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUpdate={updateTemplate}
          onDelete={deleteTemplate}
        />
      )}

      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Generated Flow JSON</DialogTitle>
          </DialogHeader>
          <Textarea
            value={getCurrentFlowJson()}
            readOnly
            className="font-mono text-sm h-[60vh]"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const IndexWithProvider = () => (
  <ReactFlowProvider>
    <Index />
  </ReactFlowProvider>
);

export default IndexWithProvider;
