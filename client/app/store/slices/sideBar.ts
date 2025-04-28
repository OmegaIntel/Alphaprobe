import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetcher } from '~/services/HTTPS';

// Define types
interface Project {
  id?: string;
  name: string;
  temp_project_id: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  documents?: string[];
}

interface PaginationParams {
  limit: number;
  offset: number;
  workflowType?: string;
}

interface PaginationMetadata {
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

// Match the actual API response structure
interface ProjectsResponse {
  message?: string;
  data: Project[];
  pagination?: PaginationMetadata;  // Make pagination optional
}

interface SideBarState {
  projects: Project[];
  activeProjectId: Project | null;
  loading: boolean;
  error: string | null;
  isCanvas: boolean;
}

// Default initial state without localStorage
const defaultInitialState: SideBarState = {
  projects: [],
  activeProjectId: null,
  loading: false,
  error: null,
  isCanvas: false
};

// Helper function to safely access localStorage (Remix-friendly)
const isServer = typeof window === 'undefined';

// Helper function to load state from localStorage
const loadStateFromLocalStorage = (): SideBarState => {
  if (isServer) {
    return defaultInitialState;
  }
  
  try {
    const serializedState = window.localStorage.getItem('sidebarState');
    if (serializedState === null) {
      return defaultInitialState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Could not load state from localStorage', err);
    return defaultInitialState;
  }
};

// Helper function to save state to localStorage
const saveStateToLocalStorage = (state: SideBarState) => {
  if (isServer) {
    return;
  }
  
  try {
    const serializedState = JSON.stringify(state);
    window.localStorage.setItem('sidebarState', serializedState);
  } catch (err) {
    console.error('Could not save state to localStorage', err);
  }
};

// Update the fetchProjects thunk to handle pagination
export const fetchProjects = createAsyncThunk(
  "sidebar/fetchProjects", 
  async (params?: PaginationParams) => {
    const limit = params?.limit || 10;
    const offset = params?.offset || 0;
    const workflowType = params?.workflowType || '';

    const config: RequestInit = { method: "GET" };

    const url = `/api/project-list?limit=${limit}&offset=${offset}${workflowType ? `&workflow_type=${workflowType}` : ''}`;

    const response = await fetcher(url, config);

    const anyResponse = response as any;

    const result: ProjectsResponse = {
      message: anyResponse.message || "Projects fetched",
      data: Array.isArray(anyResponse.data) ? anyResponse.data : [],
      pagination: {
        total: anyResponse.pagination?.total ?? (Array.isArray(anyResponse.data) ? anyResponse.data.length : 0),
        offset: anyResponse.pagination?.offset ?? offset,
        limit: anyResponse.pagination?.limit ?? limit,
        has_more: anyResponse.pagination?.has_more ?? false
      }
    };
    
    return result;
  }
);

// Initialize state with default values first 
// (hydration will happen client-side)
const initialState: SideBarState = defaultInitialState;

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    initializeStates(state) {
      if (!isServer) {
        const savedState = loadStateFromLocalStorage();
        state.isCanvas = savedState.isCanvas;
        state.activeProjectId = savedState.activeProjectId;
        // Don't load projects from localStorage as we'll fetch them from API
      }
    },
    setIsCanvas(state, action: PayloadAction<boolean>) {
      state.isCanvas = action.payload;
      saveStateToLocalStorage(state);
    },
    setProject(state, action: PayloadAction<Project>) {
      state.projects = [...state.projects, { ...action.payload }];
      state.activeProjectId = action.payload || null;
      saveStateToLocalStorage(state);
    },
    setProjects(state, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
      saveStateToLocalStorage(state);
    },
    setActiveProject(state, action: PayloadAction<Project>) {
      state.activeProjectId = action.payload;
      saveStateToLocalStorage(state);
    },
    updateProjectName(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      const project = state.projects.find((project) => project.id === id);
      if (project) {
        project.name = name;
        saveStateToLocalStorage(state);
      }
    },
    clearSidebarState(state) {
      state.isCanvas = false;
      state.activeProjectId = null;
      state.projects = [];
      
      if (!isServer) {
        window.localStorage.removeItem('sidebarState');
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        const { data, pagination } = action.payload;
        
        // If this is the first page (offset 0), replace the projects array
        // Otherwise, concatenate the new projects to the existing ones
        if (!pagination || pagination.offset === 0) {
          state.projects = data;
        } else {
          // Avoid duplicates by checking IDs
          const existingIds = new Set(state.projects.map(p => p.id || ''));
          const newProjects = data.filter(p => !existingIds.has(p.id || ''));
          state.projects = [...state.projects, ...newProjects];
        }
        
        state.loading = false;
        // We don't save projects to localStorage here as it could get large
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch projects";
      });
  }
});

// Export actions
export const {
  initializeStates,
  setIsCanvas,
  setProject,
  setProjects,
  setActiveProject,
  updateProjectName,
  clearSidebarState,
} = sidebarSlice.actions;

// Export reducer
export default sidebarSlice.reducer;