"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFineUser } from "@/hooks/use-fine-user";

export default function SettingsPage() {
  const { status, deprovision, isProvisioning } = useFineUser();
  const router = useRouter();

  useEffect(() => {
    if (status === "stopped") {
      router.replace("/provision");
    }
  }, [status, router]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="mb-1 text-2xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your agent and environment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent Environment</CardTitle>
            <CardDescription>
              Stop your running agent and release its resources. You can
              re-provision at any time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isProvisioning}>
                  {isProvisioning ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Deprovisioning...
                    </>
                  ) : (
                    "Deprovision Agent"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deprovision agent?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will stop your running agent and release its resources.
                    Your session history is preserved and will be restored when
                    you provision again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deprovision}>
                    Deprovision
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
