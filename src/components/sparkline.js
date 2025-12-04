import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import '../App.css';
import { useInstrument } from './InstrumentContext';

const Sparkline = React.memo(function Sparkline(props) {
    const { data: instrument } = useInstrument();
    const [sparkData, setSparkData] = useState([]);
    const lastDataSizeRef = useRef(0);

    const dataExists = useMemo(() => {
        return props?.sharedData?.sparkData !== null && props?.sharedData?.sparkData !== undefined;
    }, [props?.sharedData?.sparkData]);

    useEffect(() => {
        if (dataExists && props.sharedData.sparkData.length > lastDataSizeRef.current) {
            const newDataPoint = props.sharedData.sparkData[props.sharedData.sparkData.length - 1];
            lastDataSizeRef.current = props.sharedData.sparkData.length;
            setSparkData(prev => [...prev, newDataPoint]);
        }
    }, [dataExists, props?.sharedData?.sparkData]);

    const style = useMemo(() => ({
        backgroundColor: "rgb(95, 95, 95)",
        width: "100%",
        height: "100%",
        borderTop: 0,
        borderLeft: "1px solid black",
        borderRight: "1px solid black",
    }), []);

    const lastData = sparkData.length > 0 ? sparkData[sparkData.length - 1] : null;
    const openingPx = instrument?.openingPx ?? lastData;

    const lineColor = useMemo(() => {
        if (lastData === null || openingPx === null) return "#FFFFFF";
        if (lastData === openingPx) return "#FFFFFF";
        return lastData > openingPx ? "#90ff81" : "#ff6767";
    }, [lastData, openingPx]);

    const lineStyle = useMemo(() => ({
        strokeWidth: 0.5,
        stroke: lineColor,
        fill: "none"
    }), [lineColor]);

    return (
        <div className='dkGreyBg' style={style}>
            <Sparklines data={sparkData} limit={50} width={100} height={20} margin={5}>
                <SparklinesLine style={lineStyle} />
                <SparklinesSpots size={0} />
            </Sparklines>
        </div>
    );
});

export default Sparkline;