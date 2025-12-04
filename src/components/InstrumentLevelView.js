import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import InstrumentLevel from './InstrumentLevel';
import { handleRender } from '../utils/utils';
import { Profiler } from 'react';
import { useInstrument } from './InstrumentContext';

function InstrumentLevelView(props) {
    const { data: instrument } = useInstrument();
    const rowCountRef = useRef(null);
    const highLevelRef = useRef(null);
    const ilvcRef = useRef(null);
    const ilvRef = useRef(null);
    const scrollYRef = useRef(0);

    const haveValidData = useMemo(() => {
        return (
            instrument !== null &&
            instrument !== undefined &&
            props?.sharedData?.levels !== null &&
            props?.sharedData?.levels !== undefined
        );
    }, [instrument, props?.sharedData?.levels]);

    const adjustScroll = useCallback(() => {
        if (haveValidData && ilvcRef.current && ilvRef.current) {
            if (rowCountRef.current !== null) {
                const levelKeys = Object.keys(props.sharedData.levels);
                if (levelKeys.length > rowCountRef.current) {
                    const newRowCount = levelKeys.filter(px => px > highLevelRef.current).length;
                    const rowHeight = 17.5;
                    ilvcRef.current.scrollTop = scrollYRef.current + (newRowCount * rowHeight);
                }
            }
            const levelKeys = Object.keys(props.sharedData.levels);
            rowCountRef.current = levelKeys.length;
            highLevelRef.current = levelKeys.sort((a, b) => b - a)[0];
        }
    }, [haveValidData, props?.sharedData?.levels]);

    useEffect(() => {
        adjustScroll();
    }, [adjustScroll]);

    const handleScroll = useCallback(() => {
        if (ilvcRef.current) {
            scrollYRef.current = ilvcRef.current.scrollTop;
        }
    }, []);

    const containerStyle = useMemo(() => ({
        overflow: "auto",
        height: "100%",
        width: '100%',
        backgroundColor: "dimgray",
        margin: 0,
        padding: 0
    }), []);

    const sortedLevels = useMemo(() => {
        if (!haveValidData) return [];
        return Object.keys(props.sharedData.levels).sort((a, b) => b - a);
    }, [haveValidData, props?.sharedData?.levels]);

    if (!haveValidData) {
        return <div>Waiting for data</div>;
    }

    return (
        <Profiler id="Table" onRender={handleRender}>
            <div className='ilv_container hide-scrollbar' ref={ilvcRef} style={containerStyle} onScroll={handleScroll}>
                <div key="InstrumentLevelView" className="InstrumentLevelView" ref={ilvRef}>
                    {sortedLevels.map((px) => (
                        <InstrumentLevel 
                            key={`Row:${px}`}
                            level={props.sharedData.levels[px]} 
                            traded={props.sharedData.levels[px].traded}
                            lastTradePrice={props.sharedData.lastTradePrice}
                        />
                    ))}
                </div>
            </div>
        </Profiler>
    );
}

export default InstrumentLevelView;