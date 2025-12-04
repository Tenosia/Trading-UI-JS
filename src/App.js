import React, { useState, useCallback, useMemo } from 'react';
import DataManager from './components/DataManager';
import InstrumentOnDay from './components/InstrumentOnDay';
import InstrumentLevelView from './components/InstrumentLevelView';
import Sparkline from './components/sparkline';
import SplitContainer from './components/SplitContainer';
import EventLog from './components/EventLog';
import { InstrumentProvider } from './components/InstrumentContext';

function App() {
  const [sharedData, setSharedData] = useState(null);

  const handleDataChange = useCallback((newData) => {
    setSharedData(newData);
  }, []);

  const containerStyle = useMemo(() => ({
    width: 200,
    height: 700
  }), []);

  const sparklineContainerStyle = useMemo(() => ({
    width: '100%',
    height: 35
  }), []);

  return (
    <InstrumentProvider>
      <div style={containerStyle}>
        <DataManager onDataChange={handleDataChange} />
        <InstrumentOnDay data={sharedData} />
        <div style={sparklineContainerStyle}>
          <Sparkline sharedData={sharedData} />
        </div>
        <SplitContainer 
          id='ilv' 
          C1={<InstrumentLevelView initialWidth={200} sharedData={sharedData} />}
          C2={<EventLog />}
        />
      </div>
    </InstrumentProvider>
  );
}

export default App;
