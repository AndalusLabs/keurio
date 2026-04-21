import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Subscription and invoices.
        </p>
      </div>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Billing</CardTitle>
          <CardDescription>Plans and invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon — billing and subscription management will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
