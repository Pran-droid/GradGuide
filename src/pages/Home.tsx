import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Home() {
  return (
    <div className="space-y-12 py-12">
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="uppercase tracking-wider text-xs font-semibold text-primary">
          Assess your eligibility
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          Find the right <span className="italic text-primary">student loan</span> for your journey.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Enter your study details, financial profile, and funding available to get an indicative assessment of loan products.
        </p>
        <div className="pt-6">
          <Button size="lg" className="rounded-full px-8 text-base">
            Start Assessment
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 pt-12">
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle>Decision-Support Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This tool provides indicative matching based on a limited reference dataset. It is not a guarantee of loan approval or rejection.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle>Clear Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Any figures not provided by the dataset, such as tenor or exchange rates, are explicit and editable.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle>Document Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate a checklist of required documents and identify potential mismatches before applying.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
