import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

const ChooseWinnersSheetContext = createContext<React.RefObject<BottomSheetModal> | null>(null);

export const ChooseWinnersSheetContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const chooseWinnersSheetRef = useRef<BottomSheetModal>(null);

    return (
        <ChooseWinnersSheetContext.Provider value={chooseWinnersSheetRef}>
            {props.children}
        </ChooseWinnersSheetContext.Provider>
    );
};

export const useChooseWinnersSheetContext = () => {
    return useContext(ChooseWinnersSheetContext);
};
