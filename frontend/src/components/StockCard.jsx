import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const StockCard = ({ stock }) => {
  const { symbol, name, price, change } = stock;
  const prevPriceRef = useRef(price);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (price > prevPriceRef.current) {
      setFlashClass('flash-up');
      const timer = setTimeout(() => setFlashClass(''), 1000);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    } else if (price < prevPriceRef.current) {
      setFlashClass('flash-down');
      const timer = setTimeout(() => setFlashClass(''), 1000);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
  }, [price]);

  const isPositive = change >= 0;

  return (
    <div className={`card glass-card h-100 ${flashClass}`}>
      <div className="card-body d-flex flex-column justify-content-between p-4">
        <div>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="card-title fw-bold text-light mb-0">{symbol}</h5>
              <small className="text-muted d-block text-truncate" style={{ maxWidth: '160px' }}>
                {name}
              </small>
            </div>
            <span className={`badge rounded px-2.5 py-1.5 ${isPositive ? 'badge-up' : 'badge-down'}`}>
              {isPositive ? '+' : ''}
              {change.toFixed(2)}%
            </span>
          </div>
          <h3 className="fw-extrabold text-light mt-3 mb-0">
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="mt-4 pt-2 border-top border-secondary-subtle">
          <Link to={`/stock/${symbol}`} className="btn btn-outline-info btn-sm w-100 rounded-pill">
            View Analysis & Trade
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
