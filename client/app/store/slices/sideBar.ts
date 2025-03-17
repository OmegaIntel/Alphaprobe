import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Project {
  id: string;
  name: string; 
}

interface SideBarState {
  isCanvas: boolean;
  activeProjectId: string | null;
  projects: Project[];
}

// Default initial state without localStorage
const defaultInitialState: SideBarState = {
  isCanvas: false,
  activeProjectId: null,
  projects: [],
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

// Initialize state with default values first 
// (hydration will happen client-side)
const initialState: SideBarState = defaultInitialState;

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    initializeFromLocalStorage(state) {
      // This action is explicitly called after hydration
      if (!isServer) {
        const savedState = loadStateFromLocalStorage();
        state.isCanvas = savedState.isCanvas;
        state.activeProjectId = savedState.activeProjectId;
        state.projects = savedState.projects;
      }
    },
    setIsCanvas(state, action: PayloadAction<boolean>) {
      state.isCanvas = action.payload;
      saveStateToLocalStorage(state);
    },
    setProject(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      state.projects = [...state.projects, { id, name }];
      saveStateToLocalStorage(state);
    },
    setProjects(state, action: PayloadAction<Project[]>) {
      state.projects = action.payload;
      saveStateToLocalStorage(state);
    },
    setActiveProject(state, action: PayloadAction<string>) {
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
});

// Export actions
export const {
  initializeFromLocalStorage,
  setIsCanvas,
  setProject,
  setProjects,
  setActiveProject,
  updateProjectName,
  clearSidebarState,
} = sidebarSlice.actions;

// Export reducer
export default sidebarSlice.reducer;