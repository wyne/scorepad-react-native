import React from 'react';

interface Props {
    children: React.ReactNode;
    fontColor: string;
    index: number;
    playerId: string;
}

// Stub — RowsBoard renders when RadialGesture is active, so this component
// is never actually mounted. It exists only for the InteractionComponents map.
const RadialGesture: React.FC<Props> = ({ children }) => {
    return <>{children}</>;
};

export default RadialGesture;
