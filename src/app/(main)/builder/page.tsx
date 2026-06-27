"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Save, Eye, LayoutTemplateIcon, ArrowLeft, Loader2, Settings, ChevronDown } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Contact2 } from "lucide-react";
import {
  ProfileBuilderSidebar,
  ProfileBuilderCanvas,
  Section,
  Field,
  FieldType,
  migrateSectionsSchema,
} from "@/components/profile-builder";
import ProfileBuilderFieldRenderer from "@/components/profile-builder/components/profile-builder-field-renderer";
import { useProgram, useUpdateProgramSchema, useProgramsByTemplate } from "@/hooks/use-programs";
import { TemplateSettingsSheet } from "@/components/profile-builder/components/template-settings-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Initial state is empty
const initialSections: Section[] = [];

function BuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");
  const templateId = searchParams.get("templateId");

  const { data: program, isLoading: isProgramLoading } = useProgram(programId, true);
  const updateSchemaMutation = useUpdateProgramSchema();

  const [template, setTemplate] = useState<{ name: string; description: string; sections: any; isActive?: boolean } | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);

  // For template mode: track which program is selected for preview context
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const { data: programsUsingTemplate, isLoading: isProgramsLoading } = useProgramsByTemplate(templateId);
  const { data: selectedProgram } = useProgram(selectedProgramId, true);

  // In template mode, use selectedProgram for preview; otherwise use the main program
  const previewProgram = templateId ? selectedProgram : program;
  const sampleRow = (previewProgram?.data && Array.isArray(previewProgram.data) && previewProgram.data.length > 0)
    ? previewProgram.data[0]
    : undefined;

  const [sections, setSections] = useState<Section[]>(initialSections);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Set default active section to the last one if none is active and sections exist
  useEffect(() => {
    if (sections.length > 0 && !activeSectionId) {
      setActiveSectionId(sections[sections.length - 1].id);
    }
  }, [sections, activeSectionId]);

  // Set default selected program when programs list is loaded
  useEffect(() => {
    if (programsUsingTemplate && programsUsingTemplate.length > 0 && !selectedProgramId) {
      setSelectedProgramId(programsUsingTemplate[0].id);
    }
  }, [programsUsingTemplate, selectedProgramId]);

  // If templateId is provided, fetch it
  useEffect(() => {
    if (templateId) {
      setIsTemplateLoading(true);
      fetch(`/api/profile-templates/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setTemplate(data);
          } else {
            toast.error("Template tidak ditemukan.");
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Gagal memuat template.");
        })
        .finally(() => {
          setIsTemplateLoading(false);
        });
    }
  }, [templateId]);

  // Load profile schema from program details, template details, or localStorage draft if it exists
  useEffect(() => {
    const activeId = templateId || programId;
    if (!activeId) return;

    const draftKey = `profile-builder-draft-${activeId}`;
    const draft = localStorage.getItem(draftKey);

    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        if (Array.isArray(parsedDraft)) {
          const loaded = migrateSectionsSchema(parsedDraft as Section[]);
          setSections(loaded);
          if (loaded.length > 0) {
             setActiveSectionId(loaded[loaded.length - 1].id);
          }
          setHasDraft(true);
          toast.info("Memulihkan draf perubahan yang belum disimpan", {
            description: "Menampilkan layout yang belum Anda simpan sebelumnya.",
          });
          setIsLoaded(true);
          return;
        }
      } catch (e) {
        console.error("Failed to parse draft from localStorage:", e);
      }
    }

    if (templateId && template) {
      const parsed = template.sections;
      if (Array.isArray(parsed)) {
        const loaded = migrateSectionsSchema(parsed as Section[]);
        setSections(loaded);
        if (loaded.length > 0) {
          setActiveSectionId(loaded[loaded.length - 1].id);
        }
      }
      setIsLoaded(true);
    } else if (programId && program) {
      if (program.profileSchema) {
        try {
          const parsed = typeof program.profileSchema === "string" 
            ? JSON.parse(program.profileSchema) 
            : program.profileSchema;
          if (Array.isArray(parsed)) {
            const loaded = migrateSectionsSchema(parsed as Section[]);
            setSections(loaded);
            if (loaded.length > 0) {
              setActiveSectionId(loaded[loaded.length - 1].id);
            }
          }
        } catch (e) {
          console.error("Failed to parse program profileSchema:", e);
        }
      } else {
        setSections([]);
      }
      setIsLoaded(true);
    }
  }, [program, programId, template, templateId]);

  // Sync modifications to localStorage draft
  useEffect(() => {
    const activeId = templateId || programId;
    if (isLoaded && activeId) {
      const dbSchemaStr = templateId
        ? JSON.stringify(template?.sections || [])
        : typeof program?.profileSchema === "string"
          ? program.profileSchema
          : JSON.stringify(program?.profileSchema || []);
      
      const currentSchemaStr = JSON.stringify(sections);
      const draftKey = `profile-builder-draft-${activeId}`;

      if (dbSchemaStr === currentSchemaStr) {
        localStorage.removeItem(draftKey);
        setHasDraft(false);
      } else {
        localStorage.setItem(draftKey, currentSchemaStr);
        setHasDraft(true);
      }
    }
  }, [sections, isLoaded, programId, templateId, program?.profileSchema, template?.sections]);

  const handleDiscardDraft = () => {
    const activeId = templateId || programId;
    if (!activeId) return;
    const draftKey = `profile-builder-draft-${activeId}`;
    localStorage.removeItem(draftKey);
    setHasDraft(false);

    if (templateId && template) {
      setSections(template.sections as Section[]);
      if (template.sections.length > 0) {
        setActiveSectionId(template.sections[template.sections.length - 1].id);
      }
    } else if (programId && program?.profileSchema) {
      try {
        const parsed = typeof program.profileSchema === "string" 
          ? JSON.parse(program.profileSchema) 
          : program.profileSchema;
        if (Array.isArray(parsed)) {
          setSections(parsed as Section[]);
          if (parsed.length > 0) {
            setActiveSectionId(parsed[parsed.length - 1].id);
          }
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
    const deletedId = sections[index].id;
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
    
    // If active section is deleted, select another one
    if (activeSectionId === deletedId) {
      setActiveSectionId(newSections.length > 0 ? newSections[newSections.length - 1].id : null);
    }
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
    const newId = `sec-${crypto.randomUUID()}`;
    const newSection: Section = {
      id: newId,
      title: `New Section ${sections.length + 1}`,
      layout,
      fields: [],
    };
    setSections([...sections, newSection]);
    setActiveSectionId(newId); // auto-activate newly added section
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

    const targetSectionId = activeSectionId || sections[sections.length - 1].id;
    const sectionIndex = sections.findIndex((sec) => sec.id === targetSectionId);
    
    if (sectionIndex === -1) {
      toast.error("Active section not found!");
      return;
    }

    const targetSection = sections[sectionIndex];
    const newField: Field = {
      id: `field-${crypto.randomUUID()}`,
      type,
      label,
      placeholder,
      column: "left", // Default column
    };

    const updatedSection = {
      ...targetSection,
      fields: [...targetSection.fields, newField],
    };

    handleUpdateSection(sectionIndex, updatedSection);
    toast.success(`Added field "${label}" to "${targetSection.title}"`);
  };

  const handleMoveField = (sectionId: string, fieldId: string, direction: "up" | "down") => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;

        const leftFields = sec.fields.filter((f) => f.column !== "right");
        const rightFields = sec.fields.filter((f) => f.column === "right");

        const field = sec.fields.find((f) => f.id === fieldId);
        if (!field) return sec;

        const isRight = field.column === "right";
        const targetList = isRight ? rightFields : leftFields;

        const idx = targetList.findIndex((f) => f.id === fieldId);
        if (idx === -1) return sec;

        if (direction === "up" && idx === 0) return sec;
        if (direction === "down" && idx === targetList.length - 1) return sec;

        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        const updatedList = [...targetList];
        const temp = updatedList[idx];
        updatedList[idx] = updatedList[swapIdx];
        updatedList[swapIdx] = temp;

        if (isRight) {
          return { ...sec, fields: [...leftFields, ...updatedList] };
        } else {
          return { ...sec, fields: [...updatedList, ...rightFields] };
        }
      })
    );
  };

  const handleMoveFieldColumn = (sectionId: string, fieldId: string, targetCol: "left" | "right") => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;

        return {
          ...sec,
          fields: sec.fields.map((f) => {
            if (f.id === fieldId) {
              return { ...f, column: targetCol };
            }
            return f;
          }),
        };
      })
    );
  };

  const handleSave = () => {
    const activeId = templateId || programId;
    if (!activeId) {
      toast.error("Tidak dapat menyimpan: ID tidak ditemukan.");
      return;
    }

    if (templateId) {
      setIsSavingTemplate(true);
      fetch(`/api/profile-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            const draftKey = `profile-builder-draft-${templateId}`;
            localStorage.removeItem(draftKey);
            setHasDraft(false);
            setTemplate(data);
            toast.success("Layout template berhasil disimpan!");
          } else {
            toast.error("Gagal menyimpan layout template.");
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Gagal menyimpan layout template.");
        })
        .finally(() => {
          setIsSavingTemplate(false);
        });
    } else {
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
    }
  };

  const handlePreview = () => {
    const summary = sections
      .map((sec) => `${sec.title} (${sec.fields.length} fields, ${sec.layout} layout)`)
      .join("\n");
    toast.info("Layout Preview Summary", {
      description: summary || "No sections added yet.",
    });
  };

  const isLoading = templateId ? isTemplateLoading : isProgramLoading;
  const activeId = templateId || programId;
  const displayName = templateId ? template?.name : program?.name;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px] h-screen bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Memuat ruang kerja builder...</p>
      </div>
    );
  }

  if (!activeId) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 items-center justify-center min-h-[400px] h-screen bg-background">
        <p className="text-destructive font-semibold">Error: ID Program atau ID Template diperlukan untuk mengakses workspace ini.</p>
        <Button asChild>
          <Link href="/programs">Kembali ke Daftar Program</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {/* Sub-header / Title Bar inside builder layout */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
        <div className="flex items-center gap-2 font-sans">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <LayoutTemplateIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm flex items-center gap-2">
              Profile Builder - <span className="text-primary font-bold">{displayName}</span>
              {hasDraft && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                  Ada Perubahan Belum Disimpan
                </span>
              )}
            </span>

            {/* Template mode: show settings button */}
            {templateId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsSettingsSheetOpen(true)}
                title="Pengaturan Template"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={templateId ? "/profile-templates" : `/programs/${programId}/settings`}>
              <ArrowLeft className="mr-1.5 size-4" />
              Kembali
            </Link>
          </Button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <ProfileBuilderSidebar
          onAddField={handleAddField}
          sections={sections}
          programHeaders={previewProgram?.headers}
          sampleRow={sampleRow}
          onSave={handleSave}
          isSaving={templateId ? isSavingTemplate : updateSchemaMutation.isPending}
          onPreview={handlePreview}
          onDiscardDraft={handleDiscardDraft}
          hasDraft={hasDraft}
          programId={programId || selectedProgramId}
        />
        
        <ProfileBuilderCanvas
          sections={sections}
          activeSectionId={activeSectionId}
          setActiveSectionId={setActiveSectionId}
          onUpdateSection={handleUpdateSection}
          onDeleteSection={handleDeleteSection}
          onMoveSection={handleMoveSection}
          onAddSection={handleAddSection}
          onMoveField={handleMoveField}
          onMoveFieldColumn={handleMoveFieldColumn}
          sampleRow={sampleRow}
        />
      </div>
      
      <Toaster position="top-right" closeButton richColors />

      {/* Template Settings Sheet */}
      <TemplateSettingsSheet
        open={isSettingsSheetOpen}
        onOpenChange={setIsSettingsSheetOpen}
        template={template}
        programsUsingTemplate={programsUsingTemplate}
        selectedProgramId={selectedProgramId}
        onSelectedProgramChange={setSelectedProgramId}
        onSave={(updatedData) => {
          if (template) {
            setTemplate({
              ...template,
              name: updatedData.name,
              description: updatedData.description,
            });
          }
        }}
      />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <BuilderPageContent />
    </React.Suspense>
  );
}
