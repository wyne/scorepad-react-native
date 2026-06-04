import React from 'react';

interface Props {
    children: React.ReactNode;
    fontColor: string;
    index: number;
    playerId: string;
}

// Stub — RowsBoard renders when Dial is active, so this component
// is never actually mounted. It exists only for the InteractionComponents map.
const Dial: React.FC<Props> = ({ children }) => {
    return <>{children}</>;
};

export default Dial;
