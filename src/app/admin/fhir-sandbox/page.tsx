"use client";

import { useState } from "react";
import { FlaskConical, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch, ApiError } from "@/lib/api";

const DEFAULT_PAYLOAD = JSON.stringify({ resourceType: "Patient" }, null, 2);

// M40 — FHIR Validator & Sandbox. Proxy tipis ke operasi $validate server HAPI
// FHIR nyata (POST /api/fhir/validate) — tidak ada validator sendiri, murni
// tempat uji coba/debug skema JSON payload FHIR sebelum dipakai di alur nyata.
export default function FhirSandboxPage() {
  const [resourceType, setResourceType] = useState("Patient");
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  async function handleValidate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      setError("Payload is not valid JSON — fix it before submitting.");
      return;
    }

    setIsValidating(true);
    try {
      const response = await apiFetch<unknown>("/fhir/validate", {
        method: "POST",
        body: JSON.stringify({ resource_type: resourceType, payload }),
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        // Body error dari HAPI FHIR sendiri (bukan validasi Laravel) masih berupa
        // JSON yang berguna untuk debug — tampilkan juga kalau ada.
        if (err.errors) setResult(JSON.stringify(err.errors, null, 2));
      } else {
        setError("Failed to reach FHIR server.");
      }
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" /> Test FHIR Payload
          </CardTitle>
          <CardDescription className="text-xs">
            Sends the payload to the real HAPI FHIR server's <code>$validate</code> operation. Useful for debugging the schema
            before using it in the production flow (M37–M39).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleValidate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="resource-type">Resource Type</Label>
              <Input
                id="resource-type"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                placeholder="e.g. Patient, MedicationKnowledge, DetectedIssue"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payload">Payload JSON</Label>
              <Textarea
                id="payload"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={14}
                className="font-mono text-xs"
                required
              />
            </div>
            <Button type="submit" disabled={isValidating} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> {isValidating ? "Validating..." : "Validate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">FHIR Server Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-relaxed">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
