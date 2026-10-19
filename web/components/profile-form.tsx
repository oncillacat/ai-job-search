"use client";

import { useState, type ReactNode } from "react";
import { demoActions, useDemoState } from "@/lib/state/demo-store";
import type { Education, Experience, Profile } from "@/lib/data";
import { Button, Card } from "./ui";

const input =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink placeholder:text-muted/60 focus:border-sage focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[14px] text-muted">{hint}</span>}
    </label>
  );
}

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function ProfileEditor({ sample }: { sample: Profile }) {
  const { profile: stored } = useDemoState();
  // Re-mount once stored edits are read from this browser.
  return <ProfileForm key={stored ? "stored" : "sample"} initial={stored ?? sample} sample={sample} />;
}

function ProfileForm({ initial, sample }: { initial: Profile; sample: Profile }) {
  const [p, setP] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  function update(patch: Partial<Profile>) {
    setP((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  function updateExperience(expId: string, patch: Partial<Experience>) {
    update({ experience: p.experience.map((e) => (e.id === expId ? { ...e, ...patch } : e)) });
  }

  function addExperience() {
    const id = `exp-${Date.now()}`;
    update({
      experience: [{ id, title: "", org: "", location: "", start: "", end: "Present", bullets: [] }, ...p.experience],
    });
    setEditingId(id);
    setNewId(id);
  }

  function removeExperience(expId: string) {
    update({ experience: p.experience.filter((e) => e.id !== expId) });
    closeEditors();
  }

  function updateEducation(eduId: string, patch: Partial<Education>) {
    update({ education: p.education.map((e) => (e.id === eduId ? { ...e, ...patch } : e)) });
  }

  function addEducation() {
    const id = `edu-${Date.now()}`;
    update({ education: [{ id, degree: "", school: "", start: "", end: "" }, ...p.education] });
    setEditingId(id);
    setNewId(id);
  }

  function removeEducation(eduId: string) {
    update({ education: p.education.filter((e) => e.id !== eduId) });
    closeEditors();
  }

  function closeEditors() {
    setEditingId(null);
    setNewId(null);
    setConfirmRemoveId(null);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        demoActions.setProfile(p);
        setSaved(true);
      }}
    >
      <Card className="space-y-5">
        <h2 className="font-display text-xl">About you</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name">
            <input className={input} value={p.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" className={input} value={p.email} onChange={(e) => update({ email: e.target.value })} />
          </Field>
          <Field label="City">
            <input className={input} value={p.location} onChange={(e) => update({ location: e.target.value })} />
          </Field>
          <Field label="Work authorization in Canada" hint="Used to check postings with citizenship or permit rules.">
            <select
              className={input}
              value={p.workAuthorization}
              onChange={(e) => update({ workAuthorization: e.target.value })}
            >
              <option>Canadian citizen</option>
              <option>Canadian permanent resident</option>
              <option>Open work permit</option>
              <option>Employer-specific work permit</option>
              <option>Study permit (part-time work)</option>
              <option>Need sponsorship</option>
            </select>
          </Field>
        </div>
        <Field label="One-line headline">
          <input className={input} value={p.headline} onChange={(e) => update({ headline: e.target.value })} />
        </Field>
        <Field label="Summary" hint="Your master summary. Tailoring adjusts it per job; this original never changes.">
          <textarea
            rows={4}
            className={input}
            value={p.summary}
            onChange={(e) => update({ summary: e.target.value })}
          />
        </Field>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-display text-xl">What you&apos;re looking for</h2>
        <Field label="Roles" hint="Separate with commas.">
          <input
            className={input}
            defaultValue={p.targetRoles.join(", ")}
            onBlur={(e) => update({ targetRoles: list(e.target.value) })}
          />
        </Field>
        <Field label="Cities" hint="Separate with commas. Add “Remote (Canada)” if you're open to it.">
          <input
            className={input}
            defaultValue={p.targetCities.join(", ")}
            onBlur={(e) => update({ targetCities: list(e.target.value) })}
          />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-[15px] font-medium">Languages</legend>
          <div className="space-y-2">
            {p.languages.map((l, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input
                  aria-label="Language"
                  className={input}
                  value={l.name}
                  onChange={(e) =>
                    update({ languages: p.languages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })
                  }
                />
                <input
                  aria-label="Level"
                  className={input}
                  value={l.level}
                  onChange={(e) =>
                    update({ languages: p.languages.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)) })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 !px-3"
            onClick={() => update({ languages: [...p.languages, { name: "", level: "" }] })}
          >
            + Add a language
          </Button>
        </fieldset>
      </Card>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Experience</h2>
          {editingId === null && (
            <Button type="button" variant="quiet" onClick={addExperience}>
              + Add experience
            </Button>
          )}
        </div>
        {p.experience.length === 0 && (
          <p className="text-muted">No roles yet. Add the jobs, internships or research positions you want tailoring to draw on.</p>
        )}
        {p.experience.map((e) =>
          e.id === editingId ? (
            <ExperienceEditor
              key={e.id}
              exp={e}
              isNew={e.id === newId}
              onChange={(patch) => updateExperience(e.id, patch)}
              onDone={() => {
                setEditingId(null);
                setNewId(null);
              }}
              onRemove={() => removeExperience(e.id)}
            />
          ) : (
            <div key={e.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p>
                  <span className="font-medium">{e.title}</span>
                  <span className="text-muted">
                    {" "}
                    · {e.org}
                    {e.location && <> · {e.location}</>} · {e.start}–{e.end}
                  </span>
                </p>
                {editingId === null && (
                  <RowActions
                    question="Remove this role?"
                    confirming={confirmRemoveId === e.id}
                    onEdit={() => setEditingId(e.id)}
                    onAskRemove={() => setConfirmRemoveId(e.id)}
                    onRemove={() => removeExperience(e.id)}
                    onKeep={() => setConfirmRemoveId(null)}
                  />
                )}
              </div>
              {e.bullets.length > 0 && (
                <ul className="space-y-1 text-[15px]">
                  {e.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3">
                      <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ),
        )}
      </Card>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Education</h2>
          {editingId === null && (
            <Button type="button" variant="quiet" onClick={addEducation}>
              + Add education
            </Button>
          )}
        </div>
        {p.education.length === 0 && (
          <p className="text-muted">No degrees yet. Add degrees, diplomas or certificates that matter for the jobs you want.</p>
        )}
        {p.education.map((ed) =>
          ed.id === editingId ? (
            <EducationEditor
              key={ed.id}
              edu={ed}
              isNew={ed.id === newId}
              onChange={(patch) => updateEducation(ed.id, patch)}
              onDone={() => {
                setEditingId(null);
                setNewId(null);
              }}
              onRemove={() => removeEducation(ed.id)}
            />
          ) : (
            <div key={ed.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p>
                <span className="font-medium">{ed.degree}</span>
                <span className="text-muted">
                  {" "}
                  · {ed.school} · {ed.start}–{ed.end}
                </span>
              </p>
              {editingId === null && (
                <RowActions
                  question="Remove this degree?"
                  confirming={confirmRemoveId === ed.id}
                  onEdit={() => setEditingId(ed.id)}
                  onAskRemove={() => setConfirmRemoveId(ed.id)}
                  onRemove={() => removeEducation(ed.id)}
                  onKeep={() => setConfirmRemoveId(null)}
                />
              )}
            </div>
          ),
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl">Skills</h2>
        <ul className="flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <li key={s} className="flex items-center gap-1 rounded-md bg-surface-2 py-1 pl-3 pr-1 text-[15px]">
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => update({ skills: p.skills.filter((x) => x !== s) })}
                className="flex h-6 w-6 items-center justify-center rounded-sm text-muted hover:bg-line hover:text-ink"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className={input}
            placeholder="Add a skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (newSkill.trim()) update({ skills: [...p.skills, newSkill.trim()] });
                setNewSkill("");
              }
            }}
          />
          <Button
            type="button"
            variant="quiet"
            onClick={() => {
              if (newSkill.trim()) update({ skills: [...p.skills, newSkill.trim()] });
              setNewSkill("");
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-md border border-line bg-surface/95 px-4 py-3 backdrop-blur sm:w-fit">
        <Button type="submit">Save profile</Button>
        <span className="text-[15px] text-muted" aria-live="polite">
          {saved ? "Saved. Your next tailoring will use this." : "Changes stay in this browser."}
        </span>
        {initial !== sample && (
          <button
            type="button"
            className="text-[15px] text-muted underline-offset-4 hover:text-ink hover:underline"
            onClick={() => demoActions.clearProfile()}
          >
            Reset to sample
          </button>
        )}
      </div>
    </form>
  );
}

function ExperienceEditor({
  exp,
  isNew,
  onChange,
  onDone,
  onRemove,
}: {
  exp: Experience;
  isNew: boolean;
  onChange: (patch: Partial<Experience>) => void;
  onDone: () => void;
  onRemove: () => void;
}) {
  // Raw text so blank lines can be typed; saved bullets drop empty lines.
  const [bulletsText, setBulletsText] = useState(exp.bullets.join("\n"));
  const current = exp.end === "Present";
  const ready = exp.title.trim() !== "" && exp.org.trim() !== "";

  return (
    <fieldset className="settle space-y-4 rounded-2xl border border-line bg-bg p-5">
      <legend className="sr-only">{isNew ? "New role" : `Edit ${exp.title}`}</legend>
      <p className="font-display text-lg">{isNew ? "Add a role" : "Edit this role"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Job title">
          <input
            className={input}
            value={exp.title}
            placeholder="Data Analyst"
            autoFocus={isNew}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field label="Organisation">
          <input
            className={input}
            value={exp.org}
            placeholder="Harbourline Community Health"
            onChange={(e) => onChange({ org: e.target.value })}
          />
        </Field>
        <Field label="City">
          <input
            className={input}
            value={exp.location}
            placeholder="Toronto, ON"
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <input
              className={input}
              value={exp.start}
              placeholder="2023"
              inputMode="numeric"
              onChange={(e) => onChange({ start: e.target.value })}
            />
          </Field>
          <Field label="End">
            <input
              className={input}
              value={current ? "" : exp.end}
              placeholder={current ? "Present" : "2025"}
              disabled={current}
              inputMode="numeric"
              onChange={(e) => onChange({ end: e.target.value })}
            />
          </Field>
        </div>
      </div>
      <label className="flex items-center gap-3 text-[15px]">
        <input
          type="checkbox"
          checked={current}
          onChange={(e) => onChange({ end: e.target.checked ? "Present" : "" })}
          className="h-4 w-4 accent-[var(--sage)]"
        />
        I work here now
      </label>
      <Field label="What you did" hint="One point per line. These are the only facts tailoring can use, so write what really happened.">
        <textarea
          rows={Math.max(3, bulletsText.split("\n").length + 1)}
          className={input}
          value={bulletsText}
          placeholder={"Built monthly dashboards for five clinics.\nCut report preparation from two days to two hours."}
          onChange={(e) => {
            setBulletsText(e.target.value);
            onChange({ bullets: e.target.value.split("\n").map((b) => b.trim()).filter(Boolean) });
          }}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!ready} onClick={onDone}>
          Done
        </Button>
        <Button type="button" variant="ghost" onClick={isNew ? onRemove : onDone}>
          {isNew ? "Cancel" : "Close"}
        </Button>
        {!ready && <span className="text-[14px] text-muted">A job title and organisation are enough to start.</span>}
      </div>
    </fieldset>
  );
}

function RowActions({
  question,
  confirming,
  onEdit,
  onAskRemove,
  onRemove,
  onKeep,
}: {
  question: string;
  confirming: boolean;
  onEdit: () => void;
  onAskRemove: () => void;
  onRemove: () => void;
  onKeep: () => void;
}) {
  const small = "!px-3 !py-1";
  if (confirming) {
    return (
      <span className="flex flex-wrap items-center gap-1 text-[15px]" aria-live="polite">
        <span className="text-muted">{question}</span>
        <Button type="button" variant="quiet" className={small} onClick={onRemove}>
          Remove
        </Button>
        <Button type="button" variant="ghost" className={small} onClick={onKeep}>
          Keep
        </Button>
      </span>
    );
  }
  return (
    <span className="flex gap-1">
      <Button type="button" variant="ghost" className={small} onClick={onEdit}>
        Edit
      </Button>
      <Button type="button" variant="ghost" className={small} onClick={onAskRemove}>
        Remove
      </Button>
    </span>
  );
}

function EducationEditor({
  edu,
  isNew,
  onChange,
  onDone,
  onRemove,
}: {
  edu: Education;
  isNew: boolean;
  onChange: (patch: Partial<Education>) => void;
  onDone: () => void;
  onRemove: () => void;
}) {
  const ready = edu.degree.trim() !== "" && edu.school.trim() !== "";
  return (
    <fieldset className="settle space-y-4 rounded-2xl border border-line bg-bg p-5">
      <legend className="sr-only">{isNew ? "New degree" : `Edit ${edu.degree}`}</legend>
      <p className="font-display text-lg">{isNew ? "Add a degree" : "Edit this degree"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Degree" hint="Include the field, e.g. “MSc, Epidemiology”.">
          <input
            className={input}
            value={edu.degree}
            placeholder="MSc, Epidemiology"
            autoFocus={isNew}
            onChange={(e) => onChange({ degree: e.target.value })}
          />
        </Field>
        <Field label="School">
          <input
            className={input}
            value={edu.school}
            placeholder="Westbrook University"
            onChange={(e) => onChange({ school: e.target.value })}
          />
        </Field>
        <Field label="Start">
          <input
            className={input}
            value={edu.start}
            placeholder="2021"
            inputMode="numeric"
            onChange={(e) => onChange({ start: e.target.value })}
          />
        </Field>
        <Field label="End" hint="Still studying? Write your expected year, e.g. “2027 (expected)”.">
          <input
            className={input}
            value={edu.end}
            placeholder="2023"
            onChange={(e) => onChange({ end: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!ready} onClick={onDone}>
          Done
        </Button>
        <Button type="button" variant="ghost" onClick={isNew ? onRemove : onDone}>
          {isNew ? "Cancel" : "Close"}
        </Button>
        {!ready && <span className="text-[14px] text-muted">A degree and school are enough to start.</span>}
      </div>
    </fieldset>
  );
}
