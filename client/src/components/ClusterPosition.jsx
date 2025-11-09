import { useState, useEffect } from 'react';
import axios from 'axios';

const ClusterPosition = ({ x, y, onXChange, onYChange }) => {
  const [availableVars, setAvailableVars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVars = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:8000/api/data/varnames?numeric=true');
        setAvailableVars(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch variables:', err);
        setError('Failed to load variables');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVars();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center'
      }}>
        <p>Loading variables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #d32f2f',
        borderRadius: '8px',
        backgroundColor: '#ffeaea',
        textAlign: 'center',
        color: '#d32f2f'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: '20px',
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ marginBottom: '15px', fontSize: '18px', color: '#333' }}>
        Plot Clusters By:
      </h3>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#555'
          }}>
            X-Axis:
          </label>
          <select
            value={x}
            onChange={(e) => onXChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              color: 'black',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {availableVars.map(varName => (
              <option key={varName} value={varName}>
                {varName.charAt(0).toUpperCase() + varName.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#555'
          }}>
            Y-Axis:
          </label>
          <select
            value={y}
            onChange={(e) => onYChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              color: 'black',
              cursor: 'pointer'
            }}
          >
            {availableVars.map(varName => (
              <option key={varName} value={varName}>
                {varName.charAt(0).toUpperCase() + varName.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ClusterPosition;