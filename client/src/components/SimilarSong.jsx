import { useEffect, useState } from "react";
import { Box, Flex, Input, Button } from "@chakra-ui/react";
import axios from "axios";
import { DUCKDB_API } from "./Constants";
import { getChartDimensions } from "./Constants";

const SimilarSong = () => {
  const [trackName, setTrackName] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autocomplete, setAutocomplete] = useState([]);
  const { width, height } = getChartDimensions();

  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (trackName.length < 3) {
        setAutocomplete([]);
        return;
      }
      try {
        const response = await axios.get(
          `${DUCKDB_API}/autocomplete?query=${encodeURIComponent(trackName)}`,
        );
        setAutocomplete(response.data);
      } catch (err) {
        console.error("Could not fetch autocomplete suggestions:", err);
      }
    };
    const timeout = setTimeout(fetchAutocomplete, 300);
    return () => clearTimeout(timeout);
  }, [trackName]);

  const fetchSuggest = async () => {
    if (!trackName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setAutocomplete([]);
      const response = await axios.get(
        `${DUCKDB_API}/suggest?track_name=${encodeURIComponent(trackName)}`,
      );

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
    <Flex direction="column" gap={4} p={4} width={width} height={height}>
      <Box>
        <h2 style={{ marginBottom: 5, fontSize: "24px" }}>
          Song Recommendations
        </h2>
        <p style={{ color: "#666", marginBottom: 5 }}>
          Enter a song name to find similar tracks
        </p>
      </Box>
      <Box position="relative" maxW="600px">
        <Flex gap={2}>
          <Box flex="1" position="relative">
            <Input
              placeholder="Enter song name..."
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchSuggest()}
              list="track-suggestions"
            />
            {autocomplete.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left="0"
                right="0"
                bg="white"
                border="1px solid #ddd"
                borderRadius="md"
                mt={1}
                maxH="300px"
                overflowY="auto"
                zIndex={1000}
                boxShadow="lg"
              >
                {autocomplete.map((item, i) => (
                  <Box
                    key={i}
                    p={2}
                    cursor="pointer"
                    _hover={{ bg: "gray.100" }}
                    onClick={() => {
                      setTrackName(item.track_name);
                      setAutocomplete([]);
                    }}
                  >
                    <Box fontWeight="medium" color="gray.600">{item.track_name}</Box>
                    <Box fontSize="sm" color="gray.600">
                      {item.artist_name}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <Button
            onClick={fetchSuggest}
            isLoading={isLoading}
            colorScheme="blue"
          >
            Search
          </Button>
        </Flex>
      </Box>
      {error && (
        <Box color="red.500" p={3} bg="red.50" borderRadius="md">
          {error}
        </Box>
      )}
      {suggestions && (
        <Box>
          <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>
            Similar to: <strong>{suggestions.query}</strong>
          </h3>
          <Box mb={4}>
            {suggestions.similar_tracks.map((track, i) => (
              <Box key={track.track_id} p={2} borderBottom="1px solid #eee">
                {i + 1}. {track.track_name} - {track.artist_name}
                <span style={{ color: "#999", marginLeft: "10px" }}>
                  (popularity: {track.popularity})
                </span>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Flex>
  );
};

export default SimilarSong;
