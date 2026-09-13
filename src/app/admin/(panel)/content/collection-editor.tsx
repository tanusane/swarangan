"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FormFooter,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/ui/field";
import {
  COLLECTIONS,
  type CollectionKey,
  type FieldDef,
} from "@/lib/cms/collections";
import {
  emptyFormValues,
  rowToFormValues,
  type FormValue,
  type FormValues,
} from "@/lib/cms/fields";
import { cn } from "@/lib/utils";

import {
  deleteItem,
  moveItem,
  saveItem,
  setVisibility,
  type ContentResult,
} from "./actions";

/**
 * The one editor behind every content section.
 *
 * Driven entirely by the collection's description in lib/cms/collections.ts:
 * which fields the form has, whether items can be added, hidden, reordered or
 * deleted. Every change goes through the generic server actions, which check
 * all of it again; the page is then refreshed from the database.
 */

export type EditorRow = Record<string, unknown>;

interface CollectionEditorProps {
  collectionKey: CollectionKey;
  rows: readonly EditorRow[];
  /** Image previews by item id, for photo collections. */
  previews?: Readonly<Record<string, string>>;
  /** Heading override, e.g. an album's name. */
  heading?: string;
  /** Hide the heading and intro, when the page already provides them. */
  bare?: boolean;
}

export function CollectionEditor({
  collectionKey,
  rows,
  previews,
  heading,
  bare = false,
}: CollectionEditorProps) {
  const def = COLLECTIONS[collectionKey];
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const idOf = (row: EditorRow) => String(row[def.idColumn]);

  return (
    <section className="space-y-4">
      {!bare && (
        <div>
          <h2 className="text-2xl">{heading ?? def.label}</h2>
          {def.intro && (
            <p className="text-ink-muted mt-1 max-w-2xl text-sm">{def.intro}</p>
          )}
        </div>
      )}

      {rows.length === 0 && !adding && (
        <p className="text-ink-muted border-sand-300 rounded-(--radius-card) border border-dashed bg-white p-6 text-sm">
          Nothing here yet.
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((row, index) => {
          const id = idOf(row);
          return (
            <li key={id}>
              <ItemCard
                collectionKey={collectionKey}
                row={row}
                id={id}
                preview={previews?.[id]}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
                editing={editing === id}
                onEdit={() => {
                  setAdding(false);
                  setEditing(editing === id ? null : id);
                }}
                onDone={() => setEditing(null)}
              />
            </li>
          );
        })}
      </ul>

      {def.canCreate &&
        (adding ? (
          <div className="border-sand-300 rounded-(--radius-card) border bg-white p-5">
            <h3 className="mb-4 text-lg">New {def.singular}</h3>
            <ItemForm
              collectionKey={collectionKey}
              id={null}
              initial={emptyFormValues(def)}
              onDone={() => setAdding(false)}
            />
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add {def.singular}
          </Button>
        ))}
    </section>
  );
}

// ---- One item ------------------------------------------------------------------------

interface ItemCardProps {
  collectionKey: CollectionKey;
  row: EditorRow;
  id: string;
  preview: string | undefined;
  isFirst: boolean;
  isLast: boolean;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}

function ItemCard({
  collectionKey,
  row,
  id,
  preview,
  isFirst,
  isLast,
  editing,
  onEdit,
  onDone,
}: ItemCardProps) {
  const def = COLLECTIONS[collectionKey];
  const { run, busy, error } = useAction();

  const title =
    String(row[def.titleField] ?? "").trim() || `Untitled ${def.singular}`;
  const visibility = "visibility" in def ? def.visibility : undefined;
  const visible = visibility ? row[visibility.column] === true : true;

  return (
    <div
      className={cn(
        "border-sand-300 rounded-(--radius-card) border bg-white p-4 transition-opacity",
        !visible && "bg-sand-50",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {preview && (
          // A plain <img>: admin thumbnails need no optimisation, and uploaded
          // photos live on the Supabase host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            loading="lazy"
            className="size-16 shrink-0 rounded-md object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium text-blue-900",
              !visible && "text-ink-muted",
            )}
          >
            {title}
          </p>
          {visibility && (
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-0.5 text-xs",
                visible
                  ? "bg-green-100 text-green-800"
                  : "bg-sand-200 text-sand-800",
              )}
            >
              {visible ? visibility.on : visibility.off}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {busy && (
            <Loader2
              aria-label="Saving"
              className="size-4 animate-spin text-blue-700"
            />
          )}
          {def.sortable && (
            <>
              <IconButton
                label="Move up"
                disabled={busy || isFirst}
                onClick={() => run(() => moveItem(collectionKey, id, "up"))}
              >
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton
                label="Move down"
                disabled={busy || isLast}
                onClick={() => run(() => moveItem(collectionKey, id, "down"))}
              >
                <ArrowDown className="size-4" />
              </IconButton>
            </>
          )}
          {visibility && (
            <IconButton
              label={visible ? "Hide from the website" : "Show on the website"}
              disabled={busy}
              onClick={() =>
                run(() => setVisibility(collectionKey, id, !visible))
              }
            >
              {visible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </IconButton>
          )}
          <IconButton
            label={editing ? "Close" : "Edit"}
            disabled={busy}
            onClick={onEdit}
          >
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
          </IconButton>
          {def.canDelete && (
            <IconButton
              label="Delete"
              disabled={busy}
              danger
              onClick={() => {
                if (
                  window.confirm(`Delete “${title}”? This cannot be undone.`)
                ) {
                  run(() => deleteItem(collectionKey, id));
                }
              }}
            >
              <Trash2 className="size-4" />
            </IconButton>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-magenta-800 mt-2 text-sm">
          {error}
        </p>
      )}

      {editing && (
        <div className="border-sand-200 mt-4 border-t pt-4">
          <ItemForm
            collectionKey={collectionKey}
            id={id}
            initial={rowToFormValues(def, row)}
            onDone={onDone}
          />
        </div>
      )}
    </div>
  );
}

// ---- The form ------------------------------------------------------------------------

interface ItemFormProps {
  collectionKey: CollectionKey;
  id: string | null;
  initial: FormValues;
  onDone: () => void;
}

function ItemForm({ collectionKey, id, initial, onDone }: ItemFormProps) {
  const def = COLLECTIONS[collectionKey];
  const [values, setValues] = useState<FormValues>(initial);
  const { run, busy, error, fieldErrors } = useAction();

  const set = (name: string, value: FormValue) =>
    setValues((current) => ({ ...current, [name]: value }));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveItem(collectionKey, id, values), onDone);
      }}
    >
      {def.fields.map((field: FieldDef) => (
        <FieldControl
          key={field.name}
          field={field}
          value={values[field.name] ?? ""}
          error={fieldErrors[field.name]}
          onChange={(value) => set(field.name, value)}
        />
      ))}

      <FormFooter busy={busy} error={error} onCancel={onDone} />
    </form>
  );
}

interface FieldControlProps {
  field: FieldDef;
  value: FormValue;
  error: string | undefined;
  onChange: (value: FormValue) => void;
}

function FieldControl({ field, value, error, onChange }: FieldControlProps) {
  if (field.type === "boolean") {
    return (
      <Toggle
        label={field.label}
        hint={field.hint}
        checked={value === true}
        onChange={onChange}
      />
    );
  }

  const text = typeof value === "string" ? value : "";
  const multiline = field.type === "textarea" || field.type === "paragraphs";

  return (
    <Field
      label={field.label}
      hint={field.hint}
      error={error}
      required={field.required}
    >
      {(control) =>
        multiline ? (
          <TextArea
            {...control}
            value={text}
            maxLength={field.max}
            rows={field.type === "paragraphs" ? 10 : 4}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <TextInput
            {...control}
            value={text}
            maxLength={field.type === "year" ? 4 : field.max}
            inputMode={field.type === "year" ? "numeric" : undefined}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        )
      }
    </Field>
  );
}

// ---- Shared bits ---------------------------------------------------------------------

/**
 * Run a server action, show its error if any, and refresh the page from the
 * database when it succeeds.
 */
export function useAction() {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function run(action: () => Promise<ContentResult>, onSuccess?: () => void) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          onSuccess?.();
          router.refresh();
        } else {
          setError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
        }
      } catch {
        setError(
          "Something went wrong. Please check your connection and try again.",
        );
      }
    });
  }

  return { run, busy, error, fieldErrors };
}

function IconButton({
  label,
  danger = false,
  children,
  ...rest
}: {
  label: string;
  danger?: boolean;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"button">, "aria-label" | "title" | "children">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors disabled:opacity-35",
        danger
          ? "text-magenta-700 hover:bg-magenta-50"
          : "hover:bg-sand-200 text-blue-800",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
