import React, { useMemo } from 'react';
import { useInstrument } from './InstrumentContext';
import '../App.css';
import './InstrumentOnDay.css';
import { roundTo, getPxString } from '../utils/utils';

const InstrumentOnDay = React.memo(function InstrumentOnDay(props) {
  const { data: instrument } = useInstrument();

  const midPrice = props?.data?.mid;
  const decimals = instrument?.decimals ?? 2;
  const openingPx = instrument?.openingPx ?? 0;

  const priceChange = useMemo(() => {
    if (!midPrice || !openingPx) return null;
    return roundTo(midPrice - openingPx, decimals);
  }, [midPrice, openingPx, decimals]);

  const priceChangePercent = useMemo(() => {
    if (!midPrice || !openingPx) return null;
    return roundTo((midPrice - openingPx) / openingPx * 100, 2);
  }, [midPrice, openingPx]);

  if (!instrument) {
    return <div>Loading instrument data...</div>;
  }

  return (
    <div className="instrumentOnDay dkGreyBg">
      <div className="row-one">
        <div className="column-one">
          <p className='symbol'>{instrument.symbol}</p>
        </div>
        <div className="column-two">
          <p className='px'>{midPrice ? getPxString(midPrice, decimals) : '--'}</p>
        </div>
        <div className="column-three">
          <div className='currency'>{instrument.currency}</div>
        </div>
      </div>
      <div className="row-two">
        <p>
          {priceChange !== null ? getPxString(priceChange, decimals, true) : '--'} 
          ({priceChangePercent !== null ? getPxString(priceChangePercent, 2, true) : '--'}%) Today
        </p>
      </div>
    </div>
  );
});

export default InstrumentOnDay;