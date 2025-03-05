import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Project {
  id: string;
  name: string; 
}

interface SideBarState {
  isCanvas :boolean,
  activeProjectId : string | null  // Adjust type if todos have a specific structure
  projects: Project[]; // Adjust type if projects have a specific structure
}

const initialState: SideBarState = {
  isCanvas : false,
  activeProjectId : null,
  projects: [],
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setIsCanvas(state, action: PayloadAction<boolean>) {
      state.isCanvas = action.payload;
    },
    setProject(state, action: PayloadAction<{ id: string; name: string }>) {
        const { id, name } = action.payload;
        state.projects = [...state.projects, { id, name }];
    },
    setProjects(state, action: PayloadAction<any[]>) {
      state.projects = action.payload;
    },
    setActiveProject(state, action: PayloadAction<string>){
        state.activeProjectId = action.payload;
    },

    updateProjectName(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      const project = state.projects.find((project) => project.id === id);
      if (project) {
        project.name = name;
      }
    },
  },
});

// Export actions
export const {
  setIsCanvas,
  setProject,
  setProjects,
  setActiveProject,
  updateProjectName,
} = sidebarSlice.actions;

// Export reducer
export default sidebarSlice.reducer;
