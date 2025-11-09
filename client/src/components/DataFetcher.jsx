import { useState, useEffect } from 'react';
import axios from 'axios';

const DataFetcher = ({ onDataReceived }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/api/data');
        const fetchedData = response.data.results;
        setData(fetchedData);
        setError(null);

        // Share data with parent component
        if (onDataReceived) {
          onDataReceived(fetchedData);
        }
      } catch (err) {
        setError(`Failed to fetch data: ${err.message}`);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="data-fetcher">
        <h2>Gene Expression Data</h2>
        <p>Loading data from FastAPI server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-fetcher">
        <h2>Gene Expression Data</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Make sure your FastAPI server is running on http://localhost:8000</p>
      </div>
    );
  }

  return (
    <div className="data-fetcher">
      <h2>Gene Expression Data</h2>
      <p>Successfully fetched {data?.length || 0} records from FastAPI server</p>

      {data && (
        <div>
          <h3>Raw Data:</h3>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#219bbaff' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', color: 'white' }}>Gene</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', color: 'white' }}>TPM</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', color: 'white' }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black'  }}>{row.gene}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black'  }}>{row.tpm}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black'  }}>{row.metadata}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="data-summary">
            <h4>Data Summary:</h4>
            <ul>
              <li>Total genes: {data.length}</li>
              <li>Unique genes: {new Set(data.map(d => d.gene)).size}</li>
              <li>Metadata types: {Array.from(new Set(data.map(d => d.metadata))).join(', ')}</li>
              <li>TPM range: {Math.min(...data.map(d => d.tpm))} - {Math.max(...data.map(d => d.tpm))}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFetcher;