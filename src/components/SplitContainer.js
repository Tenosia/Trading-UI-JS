import React, { useEffect, useRef, useCallback, useMemo } from 'react';

const SplitContainer = (props) => {
    const dragRef = useRef(null);
    const c1Ref = useRef(null);
    const splitterRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (!dragRef.current || !c1Ref.current) return;
        const dragDiff = e.clientY - dragRef.current;
        const c1h = parseFloat(getComputedStyle(c1Ref.current).height);
        c1Ref.current.style.height = (c1h + dragDiff) + 'px';
        dragRef.current = e.clientY;
    }, []);

    const handleMouseUp = useCallback((e) => {
        dragRef.current = null;
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (splitterRef.current) {
            splitterRef.current.style.backgroundColor = "black";
        }
    }, [handleMouseMove]);

    const handleMouseDown = useCallback((e) => {
        dragRef.current = e.clientY;
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        if (splitterRef.current) {
            splitterRef.current.style.backgroundColor = "blue";
        }
    }, [handleMouseMove, handleMouseUp]);

    const handleMouseOver = useCallback(() => {
        if (splitterRef.current) {
            splitterRef.current.style.cursor = 'row-resize';
        }
    }, []);

    const handleMouseOut = useCallback(() => {
        if (splitterRef.current) {
            splitterRef.current.style.cursor = 'default';
        }
    }, []);

    useEffect(() => {
        const c1Element = document.getElementById(`${props.id}_c1`);
        const splitterElement = document.getElementById(`${props.id}_splitter`);

        c1Ref.current = c1Element;
        splitterRef.current = splitterElement;

        if (splitterElement) {
            splitterElement.addEventListener('mousedown', handleMouseDown, true);
            splitterElement.addEventListener('mouseover', handleMouseOver);
            splitterElement.addEventListener('mouseout', handleMouseOut);
        }

        // Cleanup function to prevent memory leaks
        return () => {
            if (splitterElement) {
                splitterElement.removeEventListener('mousedown', handleMouseDown, true);
                splitterElement.removeEventListener('mouseover', handleMouseOver);
                splitterElement.removeEventListener('mouseout', handleMouseOut);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [props.id, handleMouseDown, handleMouseOver, handleMouseOut, handleMouseMove, handleMouseUp]);

    const style_container = useMemo(() => ({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: 0,
        margin: 0,
        border: 0,
        height: '410px',
        width: '100%'
    }), []);

    const style_c1_container = useMemo(() => ({
        flex: 0,
        flexBasis: 'initial',
        height: '359px',
        width: '100%',
        padding: 0,
        margin: 0,
        border: '1px solid black',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'dimgray',
        overflow: 'hidden'
    }), []);

    const style_c1 = useMemo(() => ({
        flex: 'auto', 
        overflow: 'hidden',
        width: '100%'
    }), []);

    const style_splitter = useMemo(() => ({
        flex: 0,
        flexBasis: 'auto',
        backgroundColor: "black",
        width: '100%',
        height: '2px',
        padding: 0,
        margin: 0
    }), []);

    const style_c2_container = useMemo(() => ({
        flex: 1,
        display: 'flex',
        height: '50px',
        width: '100%',
        minHeight: '26px',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: 0,
        flexGrow: 1,
        margin: 0,
        border: '1px ridge black',
        backgroundColor: 'thistle'
    }), []);

    const style_c2 = useMemo(() => ({
        flex: 1,
        height: 'auto',
        width: '100%',
        overflow: 'auto',
        padding: 0,
        margin: 0,
        border: 0,
        backgroundColor: 'white'
    }), []);

    return (
        <div key={`${props.id}_container`} id={`${props.id}_container`} style={style_container}>
            <div key={`${props.id}_c1`} id={`${props.id}_c1`} style={style_c1_container}>
                <div id='c1_container' style={style_c1}>
                    {props.C1}
                </div>
            </div>
            <div key={`${props.id}_splitter`} id={`${props.id}_splitter`} style={style_splitter}></div>
            <div key={`${props.id}_c2`} id={`${props.id}_c2`} style={style_c2_container}>
                <div id='c2_container' style={style_c2}>
                    {props.C2}
                </div>
            </div>
        </div>
    )
};

export default SplitContainer;