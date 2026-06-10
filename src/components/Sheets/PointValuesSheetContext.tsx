import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

const PointValuesSheetContext = createContext<React.RefObject<BottomSheetModal> | null>(null);

export const PointValuesSheetContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const pointValuesSheetRef = useRef<BottomSheetModal>(null);

    return (
        <PointValuesSheetContext.Provider value={pointValuesSheetRef} >
            {props.children}
        </PointValuesSheetContext.Provider>
    );
};

export const usePointValuesSheetContext = () => {
    return useContext(PointValuesSheetContext);
};
