import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetcher } from "~/services/HTTPS";

interface Project {
  id?: string;
  name: string; 
  created_at?: string;
  updated_at?: string;
  user_id?:string;
  temp_project_id:string;
  documents?: string[];
}

interface SideBarState {
  isCanvas: boolean;
  activeProjectId: Project | null;
  projects: Project[];
  loading?: boolean;
  error?: string | null;
  
}

// Default initial state without localStorage
const defaultInitialState: SideBarState = {
  isCanvas: false,
  activeProjectId: null,
  projects: [],
  loading: false,
  error: null,
};

// Helper function to safely access localStorage (Remix-friendly)
const isServer = typeof window === 'undefined';

export const fetchProjects = createAsyncThunk("sidebar/fetchProjects", async () => {
  const config: RequestInit = { method: "GET" };
  const res = await fetcher("/api/project-list", config);
  return Array.isArray(res.data) ? res.data : [];
});

const getProjects = async (): Promise<Project[]> =>{
  const config: RequestInit = {
    method: 'GET',
  };
  
  const res = await fetcher('/api/project-list', config);

  return Array.isArray(res.data) ? res.data : [];
}

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

// Initialize state with default values first 
// (hydration will happen client-side)
const initialState: SideBarState = defaultInitialState;

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    initializeStates(state) {
      if (!isServer) {
        const savedState = loadStateFromLocalStorage();
        state.isCanvas = savedState.isCanvas;
        state.activeProjectId = savedState.activeProjectId;
        //state.projects = savedState.projects;
      }
    },
    setIsCanvas(state, action: PayloadAction<boolean>) {
      state.isCanvas = action.payload;
      saveStateToLocalStorage(state);
    },
    setProject(state, action: PayloadAction<Project>) {
      //const { id, name } = action.payload;
      state.projects = [...state.projects, { ...action.payload }];
      state.activeProjectId = action.payload || null
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch projects";
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