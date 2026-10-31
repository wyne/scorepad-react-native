import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';

/**
 * Snap index of the fully open game sheet, where the Unlock button is
 */
export const gameSheetExpandedIndex = 2;

const GameSheetContext = createContext<React.RefObject<BottomSheet | null> | null>(null);

/**
 * A snap index for the game sheet to open to once it mounts, for when it is
 * asked to open while hidden (fullscreen).
 */
const GameSheetPendingIndexContext = createContext<React.RefObject<number | null> | null>(null);

export const GameSheetContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const gameSheetRef = useRef<BottomSheet>(null);
    const pendingIndexRef = useRef<number | null>(null);

    return (
        <GameSheetContext.Provider value={gameSheetRef} >
            <GameSheetPendingIndexContext.Provider value={pendingIndexRef}>
                <BottomSheetModalProvider>
                    {props.children}
                </BottomSheetModalProvider>
            </GameSheetPendingIndexContext.Provider>
        </GameSheetContext.Provider>
    );
};

export const useGameSheetContext = () => {
    return useContext(GameSheetContext);
};

export const useGameSheetPendingIndex = () => {
    return useContext(GameSheetPendingIndexContext);
};
