import React, { createContext, useContext, useRef } from 'react';

import { BottomSheetModal } from '@gorhom/bottom-sheet';

const GameOverSheetContext = createContext<React.RefObject<BottomSheetModal | null> | null>(null);

export const GameOverSheetContextProvider: React.FC<React.PropsWithChildren> = (props) => {
    const gameOverSheetRef = useRef<BottomSheetModal>(null);

    return (
        <GameOverSheetContext.Provider value={gameOverSheetRef}>
            {props.children}
        </GameOverSheetContext.Provider>
    );
};

export const useGameOverSheetContext = () => {
    return useContext(GameOverSheetContext);
};
