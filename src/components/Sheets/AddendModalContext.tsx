import React, { createContext, useContext, useRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

const AddendModalContext = createContext<React.RefObject<BottomSheetModal> | null>(null);

export const AddendModalContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const addendModalRef = useRef<BottomSheetModal>(null);

    return (
        <AddendModalContext.Provider value={addendModalRef} >
            {props.children}
        </AddendModalContext.Provider>
    );
};

export const useAddendModalContext = () => {
    return useContext(AddendModalContext);
};
