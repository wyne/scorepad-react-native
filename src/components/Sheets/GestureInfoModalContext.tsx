import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

const GestureInfoModalContext = createContext<React.RefObject<BottomSheetModal> | null>(null);

export const GestureInfoModalContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const gestureInfoModalRef = useRef<BottomSheetModal>(null);

    return (
        <GestureInfoModalContext.Provider value={gestureInfoModalRef}>
            {props.children}
        </GestureInfoModalContext.Provider>
    );
};

export const useGestureInfoModalContext = () => {
    return useContext(GestureInfoModalContext);
};
