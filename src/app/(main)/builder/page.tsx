"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Save, Eye, LayoutTemplateIcon, ArrowLeft, Loader2 } from "lucide-react";
import ProfileBuilderSidebar from "@/components/profile-builder/profile-builder-sidebar";
import ProfileBuilderCanvas from "@/components/profile-builder/profile-builder-canvas";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { Section, Field, FieldType } from "@/components/profile-builder/types";
import { useProgram, useUpdateProgramSchema } from "@/hooks/use-programs";
import { migrateSectionsSchema } from "@/components/profile-builder/migrate-schema";

// Initial state is empty
const initialSections: Section[] = [];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  const { data: program, isLoading: isProgramLoading } = useProgram(programId);
  const updateSchemaMutation = useUpdateProgramSchema();

  const sampleRow = (program?.data && Array.isArray(program.data) && program.data.length > 0)
    ? program.data[0]
    : undefined;

  const [sections, setSections] = useState<Section[]>(initialSections);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Load profile schema from program details or localStorage draft if it exists
  useEffect(() => {
    if (program && programId) {
      const draftKey = `profile-builder-draft-${programId}`;
      const draft = localStorage.getItem(draftKey);

      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          if (Array.isArray(parsedDraft)) {
            setSections(migrateSectionsSchema(parsedDraft as Section[]));
            setHasDraft(true);
            toast.info("Memulihkan draf perubahan yang belum disimpan", {
              description: "Menampilkan layout yang belum Anda simpan sebelumnya.",
            });
          }
        } catch (e) {
          console.error("Failed to parse draft from localStorage:", e);
        }
      } else if (program.profileSchema) {
        try {
          const parsed = typeof program.profileSchema === "string" 
            ? JSON.parse(program.profileSchema) 
            : program.profileSchema;
          if (Array.isArray(parsed)) {
            setSections(migrateSectionsSchema(parsed as Section[]));
          }
        } catch (e) {
          console.error("Failed to parse program profileSchema:", e);
        }
      } else {
        setSections([]);
      }
      setIsLoaded(true);
    }
  }, [program, programId]);

  // Sync modifications to localStorage draft
  useEffect(() => {
    if (isLoaded && programId) {
      const dbSchemaStr = typeof program?.profileSchema === "string"
        ? program.profileSchema
        : JSON.stringify(program?.profileSchema || []);
      const currentSchemaStr = JSON.stringify(sections);
      const draftKey = `profile-builder-draft-${programId}`;

      if (dbSchemaStr === currentSchemaStr) {
        localStorage.removeItem(draftKey);
        setHasDraft(false);
      } else {
        localStorage.setItem(draftKey, currentSchemaStr);
        setHasDraft(true);
      }
    }
  }, [sections, isLoaded, programId, program?.profileSchema]);

  const handleDiscardDraft = () => {
    if (!programId) return;
    const draftKey = `profile-builder-draft-${programId}`;
    localStorage.removeItem(draftKey);
    setHasDraft(false);

    if (program?.profileSchema) {
      try {
        const parsed = typeof program.profileSchema === "string" 
          ? JSON.parse(program.profileSchema) 
          : program.profileSchema;
        if (Array.isArray(parsed)) {
          setSections(parsed as Section[]);
        }
      } catch (e) {
        setSections([]);
      }
    } else {
      setSections([]);
    }
    toast.success("Draf dibuang, kembali ke konfigurasi tersimpan.");
  };

  const handleUpdateSection = (index: number, updatedSection: Section) => {
    const updated = [...sections];
    updated[index] = updatedSection;
    setSections(updated);
  };

  const handleDeleteSection = (index: number) => {
    const sectionTitle = sections[index].title;
    setSections(sections.filter((_, i) => i !== index));
    toast.error(`Removed section "${sectionTitle}"`);
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSections(updated);
  };

  const handleAddSection = (layout: "1-col" | "2-col") => {
    const newSection: Section = {
      id: `sec-${crypto.randomUUID()}`,
      title: `New Section ${sections.length + 1}`,
      layout,
      fields: [],
    };
    setSections([...sections, newSection]);
  };

  const handleAddField = (
    type: FieldType,
    label: string,
    placeholder?: string
  ) => {
    if (sections.length === 0) {
      toast.error("Please add a section first!");
      return;
    }

    const lastIndex = sections.length - 1;
    const lastSection = sections[lastIndex];

    const newField: Field = {
      id: `field-${crypto.randomUUID()}`,
      type,
      label,
      placeholder,
    };

    const updatedSection = {
      ...lastSection,
      fields: [...lastSection.fields, newField],
    };

    handleUpdateSection(lastIndex, updatedSection);
  };

  const handleSave = () => {
    if (!programId) {
      toast.error("Tidak dapat menyimpan: ID Program tidak ditemukan.");
      return;
    }

    updateSchemaMutation.mutate({
      id: programId,
      sections: sections,
    }, {
      onSuccess: () => {
        const draftKey = `profile-builder-draft-${programId}`;
        localStorage.removeItem(draftKey);
        setHasDraft(false);
        toast.success("Konfigurasi profile berhasil disimpan!", {
          description: `Layout profile untuk program "${program?.name}" berhasil disimpan ke database.`,
        });
      },
      onError: (err) => {
        toast.error("Gagal menyimpan konfigurasi profile.");
        console.error(err);
      }
    });
  };

  const handlePreview = () => {
    const summary = sections
      .map((sec) => `${sec.title} (${sec.fields.length} fields, ${sec.layout} layout)`)
      .join("\n");
    toast.info("Layout Preview Summary", {
      description: summary || "No sections added yet.",
    });
  };

  if (isProgramLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px] h-screen bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Memuat ruang kerja builder...</p>
      </div>
    );
  }

  if (!programId) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px] h-screen bg-background">
        <p className="text-destructive font-semibold">Error: ID Program diperlukan untuk mengakses workspace ini.</p>
        <Button asChild>
          <Link href="/programs">Kembali ke Daftar Program</Link>
        </Button>
      </div>
    );
  }

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;

        if (isSortable(source)) {
          const { initialIndex, index, group, type } = source;

          if (type === "section" || group === "sections") {
            if (initialIndex !== index) {
              setSections((prev) => {
                const updated = [...prev];
                const [removed] = updated.splice(initialIndex, 1);
                updated.splice(index, 0, removed);
                return updated;
              });
            }
          } else if (type === "field" && typeof source.initialGroup === "string") {
            const splitGroup = (g: string) => {
              const i = g.lastIndexOf("-");
              return [g.slice(0, i), g.slice(i + 1)] as const;
            };

            const [sourceSectionId, sourceCol] = splitGroup(source.initialGroup);

            // Determine the target group:
            // Case A: dropped onto another sortable field — group is already updated
            // Case B: dropped onto an empty column droppable — group may not have changed,
            //         so we read the target droppable's id instead
            let targetGroupStr: string | null = null;
            if (typeof group === "string" && group !== source.initialGroup) {
              // Case A: sortable reported a new group
              targetGroupStr = group;
            } else if (target && typeof target.id === "string" && target.id.includes("-")) {
              // Case B: dropped on a droppable column (empty column)
              // target.id format: "${sectionId}-left" or "${sectionId}-right"
              const lastDash = target.id.lastIndexOf("-");
              const col = target.id.slice(lastDash + 1);
              if (col === "left" || col === "right") {
                targetGroupStr = target.id; // already in the right format
              }
            } else if (typeof group === "string") {
              // Same group reorder
              targetGroupStr = group;
            }

            if (targetGroupStr) {
              const [targetSectionId, targetCol] = splitGroup(targetGroupStr);

              if (sourceSectionId === targetSectionId) {
                // ── Same-section reorder / column swap ──────────────────────
                setSections((prev) =>
                  prev.map((sec) => {
                    if (sec.id !== sourceSectionId) return sec;

                    const fieldId = source.id;
                    const fieldToMove = sec.fields.find(f => f.id === fieldId);
                    if (!fieldToMove) return sec;

                    const remainingFields = sec.fields.filter(f => f.id !== fieldId);
                    const leftFields = remainingFields.filter((f) => f.column !== "right");
                    const rightFields = remainingFields.filter((f) => f.column === "right");
                    const targetList = targetCol === "right" ? rightFields : leftFields;

                    const updatedField = {
                      ...fieldToMove,
                      column: targetCol as "left" | "right",
                    };
                    targetList.splice(index, 0, updatedField);

                    return { ...sec, fields: [...leftFields, ...rightFields] };
                  })
                );
              } else {
                // ── Cross-section move ────────────────────────────────────
                setSections((prev) => {
                  const fieldId = source.id;

                  // 1. Find the field in the source section
                  const sourceSection = prev.find(s => s.id === sourceSectionId);
                  if (!sourceSection) return prev;
                  const fieldToMove = sourceSection.fields.find(f => f.id === fieldId);
                  if (!fieldToMove) return prev;

                  return prev.map((sec) => {
                    if (sec.id === sourceSectionId) {
                      // Remove field from source
                      return { ...sec, fields: sec.fields.filter(f => f.id !== fieldId) };
                    }

                    if (sec.id === targetSectionId) {
                      // Insert field into target at the correct column & index
                      const updatedField: typeof fieldToMove = {
                        ...fieldToMove,
                        column: targetCol as "left" | "right",
                      };

                      const leftFields = sec.fields.filter(f => f.column !== "right");
                      const rightFields = sec.fields.filter(f => f.column === "right");
                      const targetList = targetCol === "right" ? rightFields : leftFields;

                      // Clamp index to list bounds so the splice never goes out of range
                      const insertAt = Math.min(index, targetList.length);
                      targetList.splice(insertAt, 0, updatedField);

                      return { ...sec, fields: [...leftFields, ...rightFields] };
                    }

                    return sec;
                  });
                });
              }
            }
          }
        }
      }}
    >
      <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
        {/* Sub-header / Title Bar inside builder layout */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
          <div className="flex items-center gap-2 font-sans">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <LayoutTemplateIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm flex items-center gap-2">
                Profile Builder - <span className="text-primary font-bold">{program?.name}</span>
                {hasDraft && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    Ada Perubahan Belum Disimpan
                  </span>
                )}
              </span>
            </div>
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden">
          <ProfileBuilderSidebar
            onAddField={handleAddField}
            sections={sections}
            programHeaders={program?.headers}
            sampleRow={sampleRow}
            onSave={handleSave}
            isSaving={updateSchemaMutation.isPending}
            onPreview={handlePreview}
            onDiscardDraft={handleDiscardDraft}
            hasDraft={hasDraft}
            programId={programId}
          />
          
          <ProfileBuilderCanvas
            sections={sections}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onAddSection={handleAddSection}
            sampleRow={sampleRow}
          />
        </div>
        
        <Toaster position="top-right" closeButton richColors />
      </div>
    </DragDropProvider>
  );
}
