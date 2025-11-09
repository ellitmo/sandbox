import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'
import DataFetcher from './components/DataFetcher'
import D3Plot from './components/D3Test'
import ClusterVisualization from './components/ClusterVisualization'
import ClusterHistogram from './components/ClusterHistogram'
import ClusterPosition from './components/ClusterPosition'
import { Tabs, Flex, Box } from "@chakra-ui/react"

function App() {
  const [geneData, setGeneData] = useState(null)
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [xImmediate, setXImmediate] = useState('popularity')
  const [yImmediate, setYImmediate] = useState('danceability')

  const [x, setX] = useState('popularity')
  const [y, setY] = useState('danceability')

  const xTimeoutRef = useRef(null)
  const yTimeoutRef = useRef(null)

  useEffect(() => {
    if (xTimeoutRef.current) {
      clearTimeout(xTimeoutRef.current);
    }

    xTimeoutRef.current = setTimeout(() => {
      setX(xImmediate);
    }, 300);

    return () => {
      if (xTimeoutRef.current) {
        clearTimeout(xTimeoutRef.current);
      }
    };
  }, [xImmediate]);

  useEffect(() => {
    if (yTimeoutRef.current) {
      clearTimeout(yTimeoutRef.current);
    }

    yTimeoutRef.current = setTimeout(() => {
      setY(yImmediate);
    }, 300);

    return () => {
      if (yTimeoutRef.current) {
        clearTimeout(yTimeoutRef.current);
      }
    };
  }, [yImmediate]);

  const handleClusterClick = useCallback((cluster) => {
    setSelectedCluster(cluster)
    setIsModalOpen(true)
  }, []);

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCluster(null)
  }

  return (
    <>
      <h1>Sandbox</h1>
      <div className="card">
        <p>
         d3 library testing
        </p>
      </div>
      <Tabs.Root defaultValue="data">
          <Tabs.List>
              <Tabs.Trigger value="data">
                Data
              </Tabs.Trigger>
              <Tabs.Trigger value="heatmap">
                D3 Heatmap
              </Tabs.Trigger>
              <Tabs.Trigger value="clusters">
                Music Clusters
              </Tabs.Trigger>
              <Tabs.Trigger value="new">
                New
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="data">
              FastAPI Data Return
              <DataFetcher onDataReceived={setGeneData}/>
            </Tabs.Content>
            <Tabs.Content value="heatmap">
              <D3Plot data={geneData}/>
            </Tabs.Content>
            <Tabs.Content value="clusters">
              <Flex direction="column" gap={4} align="stretch" maxW="100%" overflow="hidden">
                <Box flexShrink={0}>
                  <ClusterPosition
                    x={xImmediate}
                    y={yImmediate}
                    onXChange={setXImmediate}
                    onYChange={setYImmediate}
                  />
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
                  />
                </Box>
              </Flex>
              {isModalOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={closeModal}
                >
                  <div
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '30px',
                      maxWidth: '900px',
                      maxHeight: '80vh',
                      overflow: 'auto',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={closeModal}
                      style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >
                      ×
                    </button>
                    {selectedCluster && (
                      <div>
                        <h2 style={{ marginBottom: '20px', fontSize: '24px', color: '#333' }}>
                          Cluster {selectedCluster.id} - Popularity Distribution
                        </h2>
                        <ClusterHistogram
                          varName='popularity'
                          clusterId={selectedCluster.id}
                          chartColor={selectedCluster.color}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Tabs.Content>
            <Tabs.Content value="new">
              New content here
            </Tabs.Content>
      </Tabs.Root>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
