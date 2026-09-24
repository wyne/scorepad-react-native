import React from 'react';

import { SharedValue } from 'react-native-reanimated';

export interface OptimisticScoreValues {
    currentRoundScore: SharedValue<number>;
    currentRoundTotalScore: SharedValue<number>;
}

export const OptimisticScoreContext = React.createContext<OptimisticScoreValues | null>(null);
