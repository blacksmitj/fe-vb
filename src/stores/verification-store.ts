import { create } from 'zustand';

export type MediaType = 'photo' | 'video' | 'pdf' | null;

interface VerificationState {
  // Navigation & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  currentPage: number;
  setCurrentPage: (page: number) => void;
  
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

  currentPage: 0,
  setCurrentPage: (page) => set({ currentPage: page }),

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

  resetEvaluation: () => set({ evaluationStatus: null, approvalDescription: '' }),
}));
