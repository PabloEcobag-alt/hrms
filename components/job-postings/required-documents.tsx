"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_REQUIRED_DOCUMENTS, addRequiredDocument } from "@/lib/job-posting-form";

/** The default documents plus the custom ones staff add; custom ones can be removed again. */
export function RequiredDocuments({ checked }: { checked: string[] }) {
  const [documents, setDocuments] = useState(() => [...new Set([...DEFAULT_REQUIRED_DOCUMENTS, ...checked])]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  const add = () => {
    const result = addRequiredDocument(documents, name);
    if ("error" in result) return setError(result.error);
    setDocuments(result.documents);
    setName("");
    setError(undefined);
  };

  return (
    <fieldset className="flex flex-col gap-xs">
      <legend className="text-sm font-medium">Required Documents</legend>
      {documents.map((document) => {
        const custom = !DEFAULT_REQUIRED_DOCUMENTS.includes(document);
        return (
          <div key={document} className="flex items-center gap-xs">
            <Checkbox
              id={`requiredDocuments-${document}`}
              name="requiredDocuments"
              value={document}
              defaultChecked={custom || checked.includes(document)}
            />
            <Label htmlFor={`requiredDocuments-${document}`} className="font-normal">
              {document}
            </Label>
            {custom && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${document}`}
                onClick={() => setDocuments(documents.filter((item) => item !== document))}
              >
                <X />
              </Button>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-xs">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
          placeholder="Add a document, e.g. NBI clearance"
          aria-label="New Required Document"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "requiredDocuments-error" : undefined}
        />
        <Button type="button" variant="outline" size="icon" aria-label="Add document" onClick={add}>
          <Plus />
        </Button>
      </div>
      {error && (
        <p id="requiredDocuments-error" role="alert" className="text-body-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
