import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

const GestureInfoSheetContext = createContext<React.RefObject<BottomSheetModal> | null>(null);

export const GestureInfoSheetContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const gestureInfoSheetRef = useRef<BottomSheetModal>(null);

    return (
        <GestureInfoSheetContext.Provider value={gestureInfoSheetRef}>
            {props.children}
        </GestureInfoSheetContext.Provider>
    );
};

export const useGestureInfoSheetContext = () => {
    return useContext(GestureInfoSheetContext);
};
