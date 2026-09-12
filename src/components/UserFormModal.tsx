import { useState } from "react";
import { Button, Field, inputClass, Modal } from "./ui/primitives";
import { useApp } from "../context/AppContext";
import type { UserRole } from "../../shared/types";

const ROLES: UserRole[] = ["Admin", "Managing Clerk", "Lit Paralegal", "Associate", "Partner"];

export default function UserFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addUser } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Lit Paralegal");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setName("");
    setEmail("");
    setRole("Lit Paralegal");
    setTitle("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addUser({ name: name.trim(), email: email.trim(), role, title: title.trim() || undefined });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Add team member">
      <Field label="Full name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Alvarez" />
      </Field>
      <Field label="Email" hint="Use a fake/demo address — this dashboard uses synthetic data only.">
        <input
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jordan.alvarez@seegerweiss.example"
        />
      </Field>
      <Field label="Role">
        <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title (optional)">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Litigation Paralegal" />
      </Field>
      {error && <p className="mb-3 text-xs font-medium text-brand-red">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={close}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>
          {saving ? "Adding…" : "Add member"}
        </Button>
      </div>
    </Modal>
  );
}
