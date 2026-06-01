import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

const ChooseWinnersModalContext = createContext<React.RefObject<BottomSheetModal> | null>(null);

export const ChooseWinnersModalContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const chooseWinnersModalRef = useRef<BottomSheetModal>(null);

    return (
        <ChooseWinnersModalContext.Provider value={chooseWinnersModalRef}>
            {props.children}
        </ChooseWinnersModalContext.Provider>
    );
};

export const useChooseWinnersModalContext = () => {
    return useContext(ChooseWinnersModalContext);
};
