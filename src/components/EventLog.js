import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useInstrument } from './InstrumentContext';
import './EventLog.css';

const EventLog = React.memo(function EventLog() {
    const { addCallback, removeCallback } = useInstrument();
    const [log, setLog] = useState([]);
    const logRef = useRef(log);

    useEffect(() => {
        logRef.current = log;
    }, [log]);

    const handleEvent = useCallback((msg) => {
        const now = new Date(msg[52]);
        const strTime = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: false, 
            fractionalSecondDigits: 3 
        });

        let newEntry = null;

        if (msg[35] === 'A') {
            newEntry = { timestamp: strTime, type: 'logon', msg: "Logon successful" };
        } else if (msg[35] === 8) {
            const side = msg[54] === 1 ? 'Buy' : 'Sell';
            const orderInfo = `${side} ${msg[38]} @ ${msg[44]}`;

            switch (msg[39]) {
                case 0:
                    newEntry = { timestamp: strTime, type: 'new', msg: `NEW: ${orderInfo}` };
                    break;
                case 1:
                case 2:
                    newEntry = { timestamp: strTime, type: 'fill', msg: `FILL: ${orderInfo}` };
                    break;
                case 4:
                    newEntry = { timestamp: strTime, type: 'cancel', msg: `CANCEL ${orderInfo}` };
                    break;
                case 5:
                    newEntry = { timestamp: strTime, type: 'modify', msg: `MODIFY ${orderInfo}` };
                    break;
                default:
                    break;
            }
        }

        if (newEntry) {
            setLog(prev => [...prev, newEntry]);
        }
    }, []);

    useEffect(() => {
        addCallback(handleEvent);
        return () => {
            if (removeCallback) {
                removeCallback(handleEvent);
            }
        };
    }, [addCallback, removeCallback, handleEvent]);

    const eventLogContainerStyle = useMemo(() => ({
        backgroundColor: 'white',
        flex: 1,
        overflow: 'auto'
    }), []);

    return (
        <div id='eventLog_container' style={eventLogContainerStyle}>
            {log.map((entry, index) => (
                <div key={index} className={`entry ${entry.type}`}>
                    {entry.timestamp}:: {entry.msg} 
                </div>
            ))}
        </div>
    );
});

export default EventLog;