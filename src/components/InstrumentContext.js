import { useState, useRef, createContext, useContext, useCallback, useMemo } from "react";

export const InstrumentContext = createContext(undefined);

export const InstrumentProvider = ({ children }) => {
    const [instrumentData, setInstrumentData] = useState(null);
    const eventCallbacksRef = useRef([]);

    const updateInstrumentData = useCallback((data) => {
        setInstrumentData(prev => ({ ...prev, ...data }));
    }, []);

    const addEventCallback = useCallback((cb) => {
        if (!eventCallbacksRef.current.includes(cb)) {
            eventCallbacksRef.current.push(cb);
        }
    }, []);

    const removeEventCallback = useCallback((cb) => {
        const index = eventCallbacksRef.current.indexOf(cb);
        if (index > -1) {
            eventCallbacksRef.current.splice(index, 1);
        }
    }, []);

    const contextValue = useMemo(() => ({
        data: instrumentData,
        update: updateInstrumentData,
        callbacks: eventCallbacksRef.current,
        addCallback: addEventCallback,
        removeCallback: removeEventCallback
    }), [instrumentData, updateInstrumentData, addEventCallback, removeEventCallback]);

    return (
        <InstrumentContext.Provider value={contextValue}>
            {children}
        </InstrumentContext.Provider>
    );
};

export const useInstrument = () => {
    const context = useContext(InstrumentContext);
    if (context === undefined) {
        throw new Error('useInstrument must be used within an InstrumentProvider');
    }
    return context;
};