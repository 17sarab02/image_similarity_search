import create from 'zustand';

const initialStates = {
    imageCount: null,
    selectedImage: null,
    listOfImages: [],
    connectionLoading: true,
    requestLoading: true,
    connectionLoaded: false
}

const useStore = create((set) => ({
    ...initialStates,
    setImageCount: (count)=>set({ imageCount: count} ),
    clearImageList: () => set({ listOfImages: [] }),
    addImageToList: (imageData) => set((state) => ({ ...state, listOfImages: [...state.listOfImages, imageData] })),
    selectImage: (imageData) => set({selectedImage: imageData}),
    startLoading: ()=>set({connectionLoading: true}),
    loadingSuccessful: ()=>set({connectionLoading: false, connectionLoaded: true}),
    loadingFailed: ()=>set({connectionLoading: false, connectionLoaded: false})
}));

export default useStore;