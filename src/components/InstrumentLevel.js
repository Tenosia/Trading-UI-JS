import React, { useCallback, useMemo } from 'react';
import { getPxString, AreArraysIndexEqual } from '../utils/utils';
import { useInstrument } from './InstrumentContext';

const InstrumentLevel_MyBids = React.memo(function InstrumentLevel_MyBids(props) {
    const { data: instrument } = useInstrument();
    const level = props.level;
    const px = level.px;
    const qty = level.myBidQty;

    const dragBids = useCallback((event) => { 
        event.dataTransfer.setData('application/json', JSON.stringify(level.myBids));
        event.dataTransfer.effectAllowed = 'move'; 
    }, [level.myBids]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);

    const dropBids = useCallback((event) => {
        event.preventDefault();
        const droppedData = event.dataTransfer.getData('application/json');
        const items = JSON.parse(droppedData);
        Object.values(items).forEach((order) => {
            instrument.wsSend({ 35: 'G', 49: instrument.clientId, 11: order.id, 44: px });
        });
    }, [instrument, px]);

    const handleRightClick = useCallback((event) => {
        event.preventDefault();
        Object.values(level.myBids).forEach((order) => {
            instrument.wsSend({ 35: 'F', 49: instrument.clientId, 11: order.id });
        });
    }, [instrument, level.myBids]);

    return (
        <div 
            onContextMenu={handleRightClick}
            draggable="true"
            onDragStart={dragBids} 
            onDragOver={handleDragOver} 
            onDrop={dropBids}
            key={`myBid:${px}`} 
            className={`myBid${qty !== 0 ? 'Qty' : ''}`}
        >
            {qty === 0 ? '' : qty}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.level.px === nextProps.level.px &&
        prevProps.level.myBidQty === nextProps.level.myBidQty &&
        Object.keys(prevProps.level.myBids).length === Object.keys(nextProps.level.myBids).length
    );
});

const InstrumentLevel_Bid = React.memo(function InstrumentLevel_Bid(props) {
    const { data: instrument } = useInstrument();
    const { px, qty } = props;

    const mdBidClick = useCallback(() => {
        instrument.wsSend({ 49: instrument.clientId, 35: 'D', 38: 10, 44: px });
    }, [instrument, px]);

    return (
        <div key={`Bid:${px}`} onClick={mdBidClick} className={`mdBid${qty !== null ? 'Qty' : ''}`}>
            {qty}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.px === nextProps.px && prevProps.qty === nextProps.qty;
});

const InstrumentLevel_Px = React.memo(function InstrumentLevel_Px(props) {
    const { data: instrument } = useInstrument();
    const { px, last: isLast, traded: isTraded, volPct } = props.level;

    const volumeStyle = useMemo(() => ({
        backgroundColor: 'paleGreen',
        height: '1px',
        width: `${volPct}%`
    }), [volPct]);

    const className = useMemo(() => {
        if (isLast) return 'priceRow Px Last';
        if (isTraded) return 'priceRow Px Traded';
        return 'priceRow Px';
    }, [isLast, isTraded]);

    if (isTraded && !isLast) {
        return (
            <div key={`Px:${px}`} id={`Px:${px}`} className="priceRow Px Traded">
                <div className="content">{getPxString(px, instrument?.decimals)}</div>
                <div className="volume">
                    <div style={volumeStyle}></div>
                    <div className="empty" style={{ height: '1px' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div key={`Px:${px}`} id={`Px:${px}`} className={className}>
            <span>{getPxString(px, instrument?.decimals)}</span>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.level.px === nextProps.level.px &&
        prevProps.level.last === nextProps.level.last &&
        prevProps.level.traded === nextProps.level.traded &&
        prevProps.level.volPct === nextProps.level.volPct
    );
});

const InstrumentLevel_Ask = React.memo(function InstrumentLevel_Ask(props) {
    const { data: instrument } = useInstrument();
    const { px, qty } = props;

    const mdAskClick = useCallback(() => {
        instrument.wsSend({ 49: instrument.clientId, 35: 'D', 38: -10, 44: px });
    }, [instrument, px]);

    return (
        <div key={`Ask:${px}`} onClick={mdAskClick} className={`mdAsk${qty !== null ? 'Qty' : ''}`}>
            {qty}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.px === nextProps.px && prevProps.qty === nextProps.qty;
});

const InstrumentLevel_MyAsks = React.memo(function InstrumentLevel_MyAsks(props) {
    const { data: instrument } = useInstrument();
    const level = props.level;
    const px = level.px;
    const qty = level.myAskQty;

    const dragAsks = useCallback((event) => { 
        event.dataTransfer.setData('application/json', JSON.stringify(level.myAsks));
        event.dataTransfer.effectAllowed = 'move'; 
    }, [level.myAsks]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);

    const dropAsks = useCallback((event) => {
        event.preventDefault();
        const droppedData = event.dataTransfer.getData('application/json');
        const items = JSON.parse(droppedData);
        Object.values(items).forEach((order) => {
            instrument.wsSend({ 35: 'G', 49: instrument.clientId, 11: order.id, 44: px });
        });
    }, [instrument, px]);

    const handleRightClick = useCallback((event) => {
        event.preventDefault();
        Object.values(level.myAsks).forEach((order) => {
            instrument.wsSend({ 35: 'F', 49: instrument.clientId, 11: order.id });
        });
    }, [instrument, level.myAsks]);

    return (
        <div 
            onContextMenu={handleRightClick}
            draggable="true"
            onDragStart={dragAsks} 
            onDragOver={handleDragOver} 
            onDrop={dropAsks} 
            key={`myAsk:${px}`} 
            className={`myAsk${qty !== 0 ? 'Qty' : ''}`}
        >
            {qty === 0 ? '' : qty}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.level.px === nextProps.level.px &&
        prevProps.level.myAskQty === nextProps.level.myAskQty &&
        Object.keys(prevProps.level.myAsks).length === Object.keys(nextProps.level.myAsks).length
    );
});

const InstrumentLevel = React.memo(function InstrumentLevel(props) {
    const level = props.level;
    return (
        // <Profiler id={`TR:${level.px}`} onRender={handleRender}>
            <div className="LadderRow" key={`Row:${level.px}`} >
                <InstrumentLevel_MyBids level={level}/>
                <InstrumentLevel_Bid px={level.px} qty={level.bid}/>
                <InstrumentLevel_Px level={level}/>
                <InstrumentLevel_Ask px={level.px} qty={level.ask}/>
                <InstrumentLevel_MyAsks level={level}/>
            </div>
        // </Profiler>
    )
});

export default InstrumentLevel;