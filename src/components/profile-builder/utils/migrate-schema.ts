import { Section, FieldType, MediaSubType } from "../types";

const LEGACY_MEDIA_TYPES = ["image", "pdf", "video"];

export function migrateSectionsSchema(sections: Section[]): Section[] {
  if (!Array.isArray(sections)) return [];
  
  return sections.map((section) => ({
    ...section,
    fields: (section.fields || []).map((field) => {
      // If field type is one of the legacy types, migrate to media
      const rawType = field.type as string;
      if (LEGACY_MEDIA_TYPES.includes(rawType)) {
        return {
          ...field,
          type: "media" as FieldType,
          mediaSubType: (rawType === "image" ? "image" 
            : rawType === "video" ? "video" 
            : "pdf") as MediaSubType,
          isEditable: false, // Ensure media is always read-only
        };
      }
      // If it is already media, make sure it is read-only
      if (field.type === "media") {
        return {
          ...field,
          isEditable: false,
        };
      }
      return field;
    }),
  }));
}
