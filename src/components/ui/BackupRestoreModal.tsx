import { useEffect, useState } from "react";
import {
  exportDatabaseBackup,
  importDatabaseBackup,
} from "@/db/backup";
import { Button } from "./Button";

interface BackupRestoreModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) {
      return false;
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function readTextFromClipboard(): Promise<string | null> {
  try {
    if (!navigator.clipboard?.readText) {
      return null;
    }

    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

export function BackupRestoreModal({
  open,
  onClose,
  onImported,
}: BackupRestoreModalProps) {
  const [jsonValue, setJsonValue] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose, open]);

  useEffect(() => {
    if (!open) return;
    setStatus("");
  }, [open]);

  if (!open) return null;

  const handleLoadBackup = async () => {
    setBusy(true);
    setStatus("");

    try {
      const backupJson = await exportDatabaseBackup();
      setJsonValue(backupJson);
      setStatus("Current database backup loaded into the text box.");
    } catch {
      setStatus("Could not export the current database.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyBackup = async () => {
    setBusy(true);
    setStatus("");

    try {
      const backupJson = await exportDatabaseBackup();
      setJsonValue(backupJson);

      const copied = await copyTextToClipboard(backupJson);
      setStatus(
        copied
          ? "Backup JSON copied to the clipboard."
          : "Clipboard copy was blocked. The backup JSON is loaded below for manual copy.",
      );
    } catch {
      setStatus("Could not export the current database.");
    } finally {
      setBusy(false);
    }
  };

  const handlePasteBackup = async () => {
    setBusy(true);
    setStatus("");

    try {
      const clipboardText = await readTextFromClipboard();
      if (!clipboardText) {
        setStatus("Clipboard paste is unavailable here. Paste JSON into the text box manually.");
        return;
      }

      setJsonValue(clipboardText);
      setStatus("Backup JSON pasted from the clipboard.");
    } finally {
      setBusy(false);
    }
  };

  const handleImportBackup = async () => {
    if (!jsonValue.trim()) {
      setStatus("Paste backup JSON into the text box first.");
      return;
    }

    if (
      !window.confirm(
        "Replace the current database with this backup? This overwrites the workouts and exercise library on this device.",
      )
    ) {
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const summary = await importDatabaseBackup(jsonValue);
      setStatus(
        `Imported ${summary.workoutCount} workouts and ${summary.exerciseCount} exercises.`,
      );
      onImported();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not import the backup JSON.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="flex w-full max-w-xl flex-col rounded-2xl border border-border bg-surface-raised p-6 text-text-primary shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold">Database Backup</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Long-pressing the title opens this panel. Export copies the full
            IndexedDB snapshot as JSON, and import restores it on this device.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button variant="secondary" onClick={handleLoadBackup} disabled={busy}>
            Load Current JSON
          </Button>
          <Button variant="secondary" onClick={handleCopyBackup} disabled={busy}>
            Copy JSON
          </Button>
          <Button variant="secondary" onClick={handlePasteBackup} disabled={busy}>
            Paste Clipboard
          </Button>
        </div>

        <textarea
          value={jsonValue}
          onChange={(event) => setJsonValue(event.target.value)}
          placeholder="Backup JSON will appear here. You can also paste JSON here and restore it."
          spellCheck={false}
          className="mt-4 min-h-56 w-full rounded-xl border border-border bg-surface px-3 py-3 font-mono text-xs text-text-primary outline-none transition-colors focus:border-accent"
        />

        <div className="mt-3 min-h-5 text-sm text-text-secondary">
          {status}
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleImportBackup}
            disabled={busy}
          >
            Restore Backup
          </Button>
        </div>
      </div>
    </div>
  );
}
