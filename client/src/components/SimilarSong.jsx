import { useState } from 'react';
import { Box, Flex, Input, Button } from '@chakra-ui/react';
import axios from 'axios';
import { DUCKDB_API } from './Constants';
import ClusterScatterplot from './ClusterScatterplot';

const SimilarSong = ({ xVariable = 'popularity', yVariable = 'danceability' }) => {
  const [trackName, setTrackName] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!trackName.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${DUCKDB_API}/suggest?track_name=${encodeURIComponent(trackName)}&n=10`);
      
      if (response.data.error) {
        setError(response.data.error);
        setSuggestions(null);
      } else {
        setSuggestions(response.data);
      }
    } catch (err) {
      setError(`Failed to fetch suggestions: ${err.message}`);
      setSuggestions(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" gap={4} p={4}>
      <Box>
        <h2 style={{ marginBottom: '15px', fontSize: '24px' }}>Song Recommendations</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Enter a song name to find similar tracks
        </p>
      </Box>

      {/* Search Box */}
      <Flex gap={2} maxW="600px">
        <Input
          placeholder="Enter song name..."
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          onClick={handleSearch} 
          isLoading={isLoading}
          colorScheme="blue"
        >
          Search
        </Button>
      </Flex>

      {/* Error Display */}
      {error && (
        <Box color="red.500" p={3} bg="red.50" borderRadius="md">
          {error}
        </Box>
      )}

      {/* Results */}
      {suggestions && (
        <Box>
          <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>
            Similar to: <strong>{suggestions.query}</strong>
          </h3>
          
          {/* List of suggestions */}
          <Box mb={4}>
            {suggestions.similar_tracks.map((track, i) => (
              <Box 
                key={track.track_id} 
                p={2} 
                borderBottom="1px solid #eee"
              >
                {i + 1}. {track.track_name} - {track.artist_name} 
                <span style={{ color: '#999', marginLeft: '10px' }}>
                  (popularity: {track.popularity})
                </span>
              </Box>
            ))}
          </Box>

          {/* Scatterplot visualization */}
          {/* TODO: Pass the track IDs to ClusterScatterplot to highlight them */}
          <Box>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>
              Visualization
            </h3>
            {/* You'll need to modify ClusterScatterplot to accept track IDs and highlight them */}
          </Box>
        </Box>
      )}
    </Flex>
  );
};

export default SimilarSong;