import React, { createContext, useContext, useRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

const PointSelectModalContext = createContext<React.RefObject<BottomSheetModal> | null>(null);

export const PointSelectModalContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const pointSelectModalRef = useRef<BottomSheetModal>(null);

    return (
        <PointSelectModalContext.Provider value={pointSelectModalRef} >
            {props.children}
        </PointSelectModalContext.Provider>
    );
};

export const usePointSelectModalContext = () => {
    return useContext(PointSelectModalContext);
};
