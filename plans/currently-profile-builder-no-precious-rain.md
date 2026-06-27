# Profile Builder Header Enhancement Plan

## Context
Currently, the Profile Builder header only shows `Profile Builder - {programName}`. When editing a **template** (via `templateId`), there's no context about which program is being used for preview/editing. The user wants to:

1. **Template Settings via Sheet** - edit profile template settings directly from Profile Builder using a sheet/drawer component
2. **Program Dropdown Selector** - select which program to use as context when editing templates
3. **Warning for breaking changes** - alert when editing a template that might affect multiple programs

## Current State
- Builder page: `src/app/(main)/builder/page.tsx`
- Shows: `Profile Builder - {displayName}` 
- No program context when editing templates

## Implementation Plan

### 1. Add Program Selector Dropdown to Template Mode

**File:** `src/app/(main)/builder/page.tsx`

When `templateId` is present (editing template):
- Fetch list of programs that use this template
- Show dropdown in header: "Editing template: {name} | Preview with: {programName ▼}"
- Dropdown allows selecting which program data to use for preview

**Dropdown UI:**
```tsx
<Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select program..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="preview-only">Preview Only (no data)</SelectItem>
    {programs.map(p => (
      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 2. Create Template Settings Sheet

**New File:** `src/components/profile-builder/components/template-settings-sheet.tsx`

Use shadcn/ui `Sheet` component (Drawer) to show template settings:

```tsx
<Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Template Settings</SheetTitle>
      <SheetDescription>
        Configure settings for "{template?.name}"
      </SheetDescription>
    </SheetHeader>
    {/* Template settings form */}
  </SheetContent>
</Sheet>
```

**Sheet Trigger:**
- Add a settings gear icon button in the header when editing template
- Button position: next to the program dropdown selector

**Sheet Content:**
- Template name (editable)
- Template description
- Active/Inactive toggle
- Other template-specific settings
- Save / Cancel buttons

### 3. Fetch Programs Using Template

**File:** `src/hooks/use-programs.ts`

Add new hook:
```typescript
useProgramsByTemplate(templateId: string)
```

Returns list of programs that use this specific template.

### 4. Update Header Layout

**File:** `src/app/(main)/builder/page.tsx`

```tsx
<header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6">
  {/* Left side: Back + Breadcrumb */}
  <div className="flex items-center gap-2">
    <SidebarTrigger className="-ml-1" />
    <Separator orientation="vertical" className="mr-2 h-4" />
    
    {templateId ? (
      /* Template mode */
      <div className="flex items-center gap-2">
        <LayoutTemplateIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">
          Template: <span className="text-primary font-bold">{template?.name}</span>
        </span>
        <Select value={selectedProgramId} onValueChange={handleProgramChange}>
          {/* Program dropdown */}
        </Select>
      </div>
    ) : (
      /* Program mode */
      <span className="font-semibold text-sm">
        Profile Builder - <span className="text-primary">{program?.name}</span>
      </span>
    )}
    
    {hasDraft && <DraftBadge />}
  </div>
  
  {/* Right side: Actions */}
  <div className="flex items-center gap-2">
    <Button>Kembali</Button>
  </div>
</header>
```

### 5. API Endpoint (if needed)

**File:** `src/app/api/programs/route.ts` (already exists)

Add query param to filter by templateId:
```
GET /api/programs?templateId={templateId}
```

## Files to Modify

1. **`src/app/(main)/builder/page.tsx`** - Main header logic with dropdown
2. **`src/hooks/use-programs.ts`** - Add `useProgramsByTemplate` hook
3. **`src/components/ui/select.tsx`** - Already exists (shadcn)

## New Files

1. **`src/components/profile-builder/components/template-warning-dialog.tsx`** - Warning dialog

## Verification

1. Run `npm run dev`
2. Navigate to `/builder?templateId=xxx` (edit a template)
3. Verify dropdown shows programs using this template
4. Verify warning dialog appears on first edit
5. Navigate to `/builder?programId=xxx` (edit program) - should work as before
