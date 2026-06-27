"use client";

import { useState, useEffect } from "react";
import { Section, Field, FieldType, migrateSectionsSchema } from "@/components/profile-builder";
import { useProfileBuilder, useUpdateProfileBuilder } from "@/hooks/use-profile-builders";
import { toast } from "sonner";

export function useBuilderState(builderId: string | null) {
  const { data: builder, isLoading: isBuilderLoading, refetch } = useProfileBuilder(builderId);
  const updateBuilderMutation = useUpdateProfileBuilder();

  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Set default active section
  useEffect(() => {
    if (sections.length > 0 && !activeSectionId) {
      setActiveSectionId(sections[sections.length - 1].id);
    }
  }, [sections, activeSectionId]);

  // Load profile schema from builder details or localStorage draft
  useEffect(() => {
    if (!builderId) return;

    const draftKey = `profile-builder-draft-${builderId}`;
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

    if (builder && builder.sections) {
      const parsed = builder.sections;
      if (Array.isArray(parsed)) {
        const loaded = migrateSectionsSchema(parsed as Section[]);
        setSections(loaded);
        if (loaded.length > 0) {
          setActiveSectionId(loaded[loaded.length - 1].id);
        }
      }
      setIsLoaded(true);
    }
  }, [builder, builderId]);

  // Sync modifications to localStorage draft
  useEffect(() => {
    if (isLoaded && builderId && builder) {
      const dbSchemaStr = JSON.stringify(builder.sections || []);
      const currentSchemaStr = JSON.stringify(sections);
      const draftKey = `profile-builder-draft-${builderId}`;

      if (dbSchemaStr === currentSchemaStr) {
        localStorage.removeItem(draftKey);
        setHasDraft(false);
      } else {
        localStorage.setItem(draftKey, currentSchemaStr);
        setHasDraft(true);
      }
    }
  }, [sections, isLoaded, builderId, builder]);

  // Open settings sheet automatically if no program is selected yet
  useEffect(() => {
    if (isLoaded && builder && !builder.programId) {
      setIsSettingsSheetOpen(true);
      toast.warning("Silakan pilih program terlebih dahulu", {
        description: "Pengaturan dibuka secara otomatis agar Anda dapat memilih program untuk mendapatkan header data.",
      });
    }
  }, [isLoaded, builder]);

  const handleDiscardDraft = () => {
    if (!builderId) return;
    const draftKey = `profile-builder-draft-${builderId}`;
    localStorage.removeItem(draftKey);
    setHasDraft(false);

    if (builder && builder.sections) {
      const parsed = builder.sections;
      if (Array.isArray(parsed)) {
        setSections(parsed as Section[]);
        if (parsed.length > 0) {
          setActiveSectionId(parsed[parsed.length - 1].id);
        }
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
    setActiveSectionId(newId);
  };

  const handleAddField = (type: FieldType, label: string, placeholder?: string) => {
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
      column: "left",
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

  const handleMoveFieldColumn = (
    sectionId: string,
    fieldId: string,
    targetCol: "left" | "right"
  ) => {
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
    if (!builderId) {
      toast.error("Tidak dapat menyimpan: ID tidak ditemukan.");
      return;
    }

    updateBuilderMutation.mutate(
      {
        id: builderId,
        sections: sections,
      },
      {
        onSuccess: () => {
          const draftKey = `profile-builder-draft-${builderId}`;
          localStorage.removeItem(draftKey);
          setHasDraft(false);
          toast.success("Konfigurasi profile berhasil disimpan!");
        },
        onError: (err: any) => {
          toast.error(err.message || "Gagal menyimpan konfigurasi.");
        },
      }
    );
  };

  const handlePreview = () => {
    const summary = sections
      .map((sec) => `${sec.title} (${sec.fields.length} fields, ${sec.layout} layout)`)
      .join("\n");
    toast.info("Layout Preview Summary", {
      description: summary || "No sections added yet.",
    });
  };

  const previewProgram = builder?.program;
  const sampleRow =
    previewProgram?.data && Array.isArray(previewProgram.data) && previewProgram.data.length > 0
      ? (previewProgram.data[0] as Record<string, any>)
      : undefined;

  return {
    builder,
    isBuilderLoading,
    refetch,
    sections,
    activeSectionId,
    setActiveSectionId,
    isSettingsSheetOpen,
    setIsSettingsSheetOpen,
    hasDraft,
    sampleRow,
    previewProgram,
    isSaving: updateBuilderMutation.isPending,
    handleDiscardDraft,
    handleUpdateSection,
    handleDeleteSection,
    handleMoveSection,
    handleAddSection,
    handleAddField,
    handleMoveField,
    handleMoveFieldColumn,
    handleSave,
    handlePreview,
  };
}
