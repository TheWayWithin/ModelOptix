export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and administrative controls.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Users
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Models in Catalog
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Active Overrides
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Running Jobs
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-muted px-3 py-2 text-sm">
            Sync Models
          </span>
          <span className="rounded-md bg-muted px-3 py-2 text-sm">
            Clear Cache
          </span>
          <span className="rounded-md bg-muted px-3 py-2 text-sm">
            Run Reaper
          </span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">
          Admin features will be implemented in Phase 5.
        </p>
      </div>
    </div>
  );
}
