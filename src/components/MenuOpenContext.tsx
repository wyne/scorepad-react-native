import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

type MenuOpenContextType = {
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;
};

const MenuOpenContext = createContext<MenuOpenContextType>({
    menuOpen: false,
    setMenuOpen: () => {},
});

export const MenuOpenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <MenuOpenContext.Provider value={{ menuOpen, setMenuOpen }}>
            {children}
        </MenuOpenContext.Provider>
    );
};

export const useMenuOpen = () => useContext(MenuOpenContext);
