"use client";

import { useState } from "react";
import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConnectButton } from "./connect-button";

type Props = {
  nameSlug: string;
  name: string;
  description: string;
  imgSrc: string;
  connected: boolean;
  onConnectionChange?: () => void;
};

export function PipedreamAppCard({
  nameSlug,
  name,
  description,
  imgSrc,
  connected,
  onConnectionChange,
}: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-1">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={name}
              className="size-10 rounded-lg object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <Plug className="size-5" />
          )}
        </div>
        <CardTitle className="text-base">{name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        {connected ? (
          <Button variant="secondary" size="sm" disabled>
            Connected
          </Button>
        ) : (
          <ConnectButton provider={nameSlug} onSuccess={onConnectionChange} />
        )}
      </CardFooter>
    </Card>
  );
}
