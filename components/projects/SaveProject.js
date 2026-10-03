"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProjectSave } from "@/app/actions/projects";
import { btn } from "@/components/ui";
export default function SaveProject({ id, initial = false }) {
  const [saved, set] = useState(initial),
    [pending, start] = useTransition(),
    [error, setError] = useState(""),
    router = useRouter();
  return (
    <div>
      <button
        disabled={pending}
        aria-pressed={saved}
        className={btn("soft")}
        onClick={() =>
          start(async () => {
            const r = await toggleProjectSave(id);
            if (r.login) router.push("/login?next=/projects");
            else if (r.error) setError(r.error);
            else set(r.saved);
          })
        }
      >
        {saved ? "Saved project" : "Save project"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
