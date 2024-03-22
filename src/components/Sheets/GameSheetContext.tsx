import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';

const GameSheetContext = createContext<React.RefObject<BottomSheet> | null>(null);

export const GameSheetContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const gameSheetRef = useRef<BottomSheet>(null);

    return (
        <GameSheetContext.Provider value={gameSheetRef} >
            <BottomSheetModalProvider>
                {props.children}
            </BottomSheetModalProvider>
        </GameSheetContext.Provider>
    );
};

export const useGameSheetContext = () => {
    return useContext(GameSheetContext);
};
