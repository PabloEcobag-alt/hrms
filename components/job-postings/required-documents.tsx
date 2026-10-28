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
    <fieldset className="flex flex-col gap-[10px]">
      <legend className="mb-[10px] text-[13px] font-medium text-[#27272a]">Required documents</legend>
      {documents.map((title) => {
        const custom = !DEFAULT_REQUIRED_DOCUMENTS.includes(title);
        return (
          <div key={title} className="flex items-center gap-[10px]">
            <Checkbox
              id={`requiredDocuments-${title}`}
              name="requiredDocuments"
              value={title}
              defaultChecked={custom || checked.includes(title)}
              className="size-4 rounded-[4px] border-[1.5px] border-[#d4d4d8] shadow-none data-[state=checked]:border-primary [&_svg]:size-3"
            />
            <Label htmlFor={`requiredDocuments-${title}`} className="text-sm font-medium text-[#18181b]">
              {title}
            </Label>
            {custom && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${title}`}
                onClick={() => setDocuments(documents.filter((item) => item !== title))}
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
          className="h-auto rounded-lg border-[#e4e4e7] px-[12px] py-[10px] text-sm shadow-none placeholder:text-[#a1a1aa]"
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
