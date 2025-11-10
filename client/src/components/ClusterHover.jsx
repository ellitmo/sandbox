import { Box, Text, VStack, HStack, Badge } from "@chakra-ui/react";

const ClusterHover = ({ cluster, position, categoricalData }) => {
  if (!cluster || !position) return null;
  return (
    <Box
      position="fixed"
      left={position.x + 20}
      top={position.y - 220} // move to above + right of bubble
      bg="white"
      border="1px solid #ddd"
      borderRadius="md"
      padding="10px"
      boxShadow="lg"
      pointerEvents="none"
      zIndex={100}
      minWidth="200px"
    >
      <VStack align="start" spacing={1}>
        <HStack>
          <Badge colorScheme="blue">Cluster {cluster.id}</Badge>
          <Text fontSize="xs" color="gray.600">
            {cluster.size} tracks
          </Text>
        </HStack>

        <Box>
          <Text fontSize="sm" fontWeight="bold">
            Position:
          </Text>
          <Text fontSize="xs" color="gray.700">
            X: {cluster.originalX?.toFixed(2)}
          </Text>
          <Text fontSize="xs" color="gray.700">
            Y: {cluster.originalY?.toFixed(2)}
          </Text>
        </Box>

        {categoricalData && (
          <Box>
            <Text fontSize="sm" fontWeight="bold" mb={1}>
              Most Common:
            </Text>
            {Object.entries(categoricalData.categories).map(([key, value]) => (
              <Text key={key} fontSize="xs" color="gray.700">
                {key}: <strong>{value}</strong>
              </Text>
            ))}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ClusterHover;
