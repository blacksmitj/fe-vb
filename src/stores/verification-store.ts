import { create } from 'zustand';

export type MediaType = 'photo' | 'video' | 'pdf' | null;

interface VerificationState {
  // Navigation & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  currentRowIndex: number;
  setCurrentRowIndex: (index: number) => void;

  currentParticipantId: string | null;
  setCurrentParticipantId: (id: string | null) => void;
  
  totalRows: number;
  setTotalRows: (total: number) => void;

  // Media Viewer
  isMediaViewerOpen: boolean;
  mediaType: MediaType;
  mediaUrl: string | null;
  openMediaViewer: (type: MediaType, url: string) => void;
  closeMediaViewer: () => void;

  // Evaluation Status (Drafting)
  evaluationStatus: string | null;
  setEvaluationStatus: (status: string | null) => void;
  
  approvalDescription: string;
  setApprovalDescription: (desc: string) => void;
  
  resetEvaluation: () => void;
}

export const useVerificationStore = create<VerificationState>()((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  currentRowIndex: 0,
  setCurrentRowIndex: (index) => set({ currentRowIndex: index }),

  currentParticipantId: null,
  setCurrentParticipantId: (id) => set({ currentParticipantId: id }),

  totalRows: 0,
  setTotalRows: (total) => set({ totalRows: total }),

  isMediaViewerOpen: false,
  mediaType: null,
  mediaUrl: null,
  openMediaViewer: (type, url) => set({ isMediaViewerOpen: true, mediaType: type, mediaUrl: url }),
  closeMediaViewer: () => set({ isMediaViewerOpen: false, mediaType: null, mediaUrl: null }),

  evaluationStatus: null,
  setEvaluationStatus: (status) => set({ evaluationStatus: status }),
  
  approvalDescription: '',
  setApprovalDescription: (desc) => set({ approvalDescription: desc }),

  resetEvaluation: () => set({ evaluationStatus: null, approvalDescription: '', currentParticipantId: null }),
}));
