"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

// M27 — editor rich-text minimal untuk konten annotation. Hanya StarterKit
// (bold, italic, heading, list, dst.) — dipakai baik untuk mode edit (draft
// pharmacist/senior reviewer) maupun mode read-only (tampilan current
// content, panel diff arbitrase M32).
export function AnnotationEditor({
  content,
  editable,
  onChange,
  className,
}: {
  content: string;
  editable: boolean;
  onChange?: (html: string) => void;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sinkronkan flag editable bila prop berubah setelah editor terbentuk
  // (mis. toggle tombol "Edit").
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Sinkronkan konten bila berubah dari luar (mis. setelah reload data
  // pasca simpan/rollback), tapi jangan timpa saat user sedang mengetik.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-transparent px-3 py-2 text-sm dark:bg-input/30",
        "[&_.ProseMirror]:min-h-24 [&_.ProseMirror]:outline-none",
        "[&_.ProseMirror_p]:mb-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
        "[&_.ProseMirror_h1]:text-lg [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-semibold",
        "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:text-muted-foreground",
        !editable && "border-transparent bg-muted/30 px-3 py-2 dark:bg-muted/10",
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
