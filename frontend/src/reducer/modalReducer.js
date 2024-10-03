export const initialState = {
  selectedFile: null,
  baseName: "",
  extension: "",
  tags: [],
  category: null,
  subCategory: null,
  description: "",
  isDocumentInfoVisible: false,
  loading: false,
};
export const reducer = (state, action) => {
  switch (action.type) {
    case "SET_SELECTED_FILE":
      if (!action.payload) {
        return {
          ...state,
          selectedFile: null,
          baseName: "",
          extension: "",
        };
      }
      const { name: fullName } = action.payload;
      const dotIndex = fullName.lastIndexOf(".");
      return {
        ...state,
        selectedFile: action.payload,
        baseName: fullName.substring(0, dotIndex),
        extension: fullName.substring(dotIndex),
      };
    case "SET_FILE_NAME":
      return { ...state, baseName: action.payload };
    case "ADD_TAG":
      if (!state.tags) {
        return {
          ...state,
          tags: action.payload ? [action.payload] : [],
        };
      } else if (!state.tags.includes(action.payload)) {
        return { ...state, tags: [...state.tags, action.payload] };
      }
      return state;
    case "SET_TAGS":
      return { ...state, tags: action.payload || [] };
    case "REMOVE_TAG":
      return {
        ...state,
        tags: state.tags.filter((tag) => tag !== action.payload),
      };
    case "TOGGLE_DOCUMENT_INFO":
      return { ...state, isDocumentInfoVisible: !state.isDocumentInfoVisible };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_SUBCATEGORY":
      return { ...state, subCategory: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "START_UPLOAD":
      return { ...state, loading: true };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
};
