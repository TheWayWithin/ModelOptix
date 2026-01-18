export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to ModelOptix. Here&apos;s your AI portfolio overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Products
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Active Opportunities
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Potential Savings
          </div>
          <div className="mt-2 text-3xl font-bold">$0</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Sanity Checks
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">
          Your dashboard content will appear here. Add products to get started.
        </p>
      </div>
    </div>
  );
}
