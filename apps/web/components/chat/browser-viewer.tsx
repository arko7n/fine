"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Monitor, X } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import config from "@/lib/config";

type Props = {
  onClose: () => void;
};

const WS_BASE = config.apiUrl.replace(/^http/, "ws");

export function BrowserViewer({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Frame metadata for coordinate mapping
  const metadataRef = useRef({ offsetTop: 0, pageScaleFactor: 1, deviceWidth: 1024, deviceHeight: 768 });

  const sendCDP = useCallback((method: string, params?: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: Date.now(), method, params }));
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/api/browser/ws?token=session`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      sendCDP("Page.startScreencast", {
        format: "jpeg",
        quality: 60,
        maxWidth: 1024,
      });
    };

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (msg.method === "Page.screencastFrame") {
        const params = msg.params as {
          data: string;
          sessionId: number;
          metadata: { offsetTop: number; pageScaleFactor: number; deviceWidth: number; deviceHeight: number };
        };

        metadataRef.current = params.metadata;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
        };
        img.src = `data:image/jpeg;base64,${params.data}`;

        // ACK the frame
        sendCDP("Page.screencastFrameAck", { sessionId: params.sessionId });
      }
    };

    ws.onerror = () => {
      setError("Connection error");
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      sendCDP("Page.stopScreencast");
      ws.close();
    };
  }, [sendCDP]);

  const mapCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const { pageScaleFactor, offsetTop } = metadataRef.current;
    return {
      x: (e.clientX - rect.left) * scaleX / pageScaleFactor,
      y: (e.clientY - rect.top) * scaleY / pageScaleFactor + offsetTop,
    };
  }, []);

  const handleMouseEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>, type: string) => {
      const { x, y } = mapCoords(e);
      sendCDP("Input.dispatchMouseEvent", {
        type,
        x: Math.round(x),
        y: Math.round(y),
        button: "left",
        clickCount: type === "mousePressed" || type === "mouseReleased" ? 1 : 0,
      });
    },
    [mapCoords, sendCDP]
  );

  const handleKeyEvent = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const type = e.type === "keydown" ? "keyDown" : "keyUp";
      sendCDP("Input.dispatchKeyEvent", {
        type,
        key: e.key,
        code: e.code,
        text: e.key.length === 1 ? e.key : undefined,
      });
    },
    [sendCDP]
  );

  return (
    <Card className="my-2 gap-0 overflow-hidden py-0">
      <CardHeader className="flex-row items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Monitor className="size-3.5" />
          <span>Browser Session</span>
          {connected && (
            <span className="size-1.5 rounded-full bg-green-500" />
          )}
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            {error}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            tabIndex={0}
            className="w-full cursor-pointer outline-none"
            style={{ maxHeight: 500 }}
            onMouseDown={(e) => handleMouseEvent(e, "mousePressed")}
            onMouseUp={(e) => handleMouseEvent(e, "mouseReleased")}
            onMouseMove={(e) => handleMouseEvent(e, "mouseMoved")}
            onKeyDown={handleKeyEvent}
            onKeyUp={handleKeyEvent}
          />
        )}
      </CardContent>
    </Card>
  );
}
