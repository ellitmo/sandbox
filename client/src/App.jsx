import { useState, useCallback } from "react";
import "./App.css";
import ClusterVisualization from "./components/ClusterVisualization";
import ClusterHistogram from "./components/ClusterHistogram";
import ClusterPosition from "./components/ClusterPosition";
import ClusterScatterplot from "./components/ClusterScatterplot";
import CloseButton from "./components/CloseButton";
import SimilarSong from "./components/SimilarSong";
import { Tabs, Flex, Box } from "@chakra-ui/react";

function App() {
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [isHistogramOpen, setIsHistogramOpen] = useState(false);
  const [showScatterplot, setShowScatterplot] = useState(false);

  const [x, setX] = useState("popularity");
  const [y, setY] = useState("danceability");

  const handleClusterClick = useCallback((event, cluster) => {
    if (event.shiftKey) {
      console.log(cluster);
      setSelectedClusters((prev) => {
        const current = prev || [];
        if (current.find((c) => c.id === cluster.id)) {
          return current.filter((c) => c.id !== cluster.id);
        }
        if (current.length >= 2) {
          return [current[1], cluster];
        }
        const newSelection = [...current, cluster];
        if (newSelection.length === 2) {
          setShowScatterplot(true);
        }
        return newSelection;
      });
    } else {
      setSelectedClusters([cluster]);
      setIsHistogramOpen(true);
    }
  }, []);

  const closeHistogram = () => {
    setIsHistogramOpen(false);
    setSelectedClusters(null);
  };

  const closeScatterplot = () => {
    setShowScatterplot(false);
    setSelectedClusters(null);
  };

  return (
    <>
      <h1>Sandbox</h1>
      <div className="card">
        <p>d3 library testing</p>
      </div>
      <Tabs.Root defaultValue="data">
        <Tabs.List>
          <Tabs.Trigger value="clusters">Music Clusters</Tabs.Trigger>
          <Tabs.Trigger value="recommendations">Recommendations</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="clusters">
          <Flex
            direction="column"
            gap={4}
            align="stretch"
            maxW="100%"
            overflow="hidden"
          >
            <Box flexShrink={0}>
              <ClusterPosition x={x} y={y} onXChange={setX} onYChange={setY} />
            </Box>
            <Box
              flexShrink={0}
              minH="580px"
              w="100%"
              display="flex"
              justifyContent="center"
              alignItems="flex-start"
              position="relative"
            >
              <ClusterVisualization
                key="stable-cluster-visualization"
                onClusterClick={handleClusterClick}
                xVariable={x}
                yVariable={y}
                selectedClusters={selectedClusters}
              />
            </Box>
          </Flex>
          {isHistogramOpen && selectedClusters.length > 0 && (
            <Flex
              position="fixed"
              top="0"
              left="0"
              width="100vw"
              height="100vh"
              bg="blackAlpha.600"
              zIndex="1000"
              align="center"
              justify="center"
              onClick={closeHistogram}
            >
              <Box
                bg="white"
                borderRadius="md"
                padding="30px"
                maxWidth="900px"
                maxHeight="80vh"
                overflow="auto"
                boxShadow="xl"
                position="relative"
                onClick={(e) => e.stopPropagation()}
              >
                <CloseButton onClick={closeHistogram} />
                <ClusterHistogram
                  clusterId={selectedClusters[0].id}
                  chartColor={selectedClusters[0].color}
                />
              </Box>
            </Flex>
          )}
          {showScatterplot && selectedClusters.length === 2 && (
            <Flex
              position="fixed"
              top="0"
              left="0"
              width="100vw"
              height="100vh"
              bg="blackAlpha.600"
              zIndex="1000"
              align="center"
              justify="center"
              onClick={closeScatterplot} // Add this
            >
              <Box
                bg="white"
                borderRadius="md"
                padding="30px"
                maxWidth="900px"
                maxHeight="80vh"
                overflow="auto"
                boxShadow="xl"
                position="relative"
                onClick={(e) => e.stopPropagation()} // Add this
              >
                <CloseButton onClick={closeScatterplot} />
                <ClusterScatterplot
                  clusterId1={selectedClusters[0].id}
                  clusterId2={selectedClusters[1].id}
                  xVariable={x}
                  yVariable={y}
                />
              </Box>
            </Flex>
          )}
        </Tabs.Content>
        <Tabs.Content value="recommendations">
          <Flex>
          <SimilarSong xVariable={x} yVariable={y}/>
          </Flex>
        </Tabs.Content>
      </Tabs.Root>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
