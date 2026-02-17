import { IntegrationGrid } from "@/components/integrations/integration-grid";

export default function IntegrationsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-1 text-2xl font-semibold">Integrations</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect your financial accounts to unlock AI-powered insights.
        </p>
        <IntegrationGrid />
      </div>
    </div>
  );
}
