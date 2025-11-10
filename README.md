## Quickstart
If you have conda installed, run `make venv` to stand up initial environment
and `make install` to install both pip and node packages. 

To generate the database and load in the spotify track data + clustering artifacts,
run `python setup_db.py`. This will do some light pre-processing, run a KMeans
algorithm and an Approximate Nearest Neighbors algorithm and load relevant 
results into duckdb (`server/db.duckdb`) and a file titled `server/tracks.pkl`

Now just run `make app` and navigate to http://localhost:5173! Alternately,
run `make server` and `make client` separately.

## Stack Overview
The backend server is run using FastAPI - I like the typing,
automatic doc generation + async support. The server is mostly fetching data 
from duckdb. Working with tabular data and using lookup tables like the ones
I stood up to map tracks to clusters are both a good use case for a relational database.
Doing this preprocessing (i.e, cluster generation & storage of index information
for the approximate nearest neighbors results) saves us a lot of computation time
when running the app, and is an easy way to make customizeable queries (such
as the route that generates autocomplete suggestions)

The frontend client is written as a React app, using mostly chakra for 
UI elements and d3 for calculations and plotting. Where I could, I created
atomic components to avoid repeated boilerplate and made use of react's memoization for performance. 
The frontend code was formatted with prettier (`npx prettier`) and I created the basic skeleton for the frontend using vite (`npm create vite@latest`). 

## Data Processing & Algorithm Selection

The data pre-processing was lightweight, primarily consisting of data cleaning and encoding non-numeric variables (genre, key, mode) to create a numeric feature matrix. My exploratory analysis can be found in `spotify_kmeans.ipynb`.

I opted for KMeans clustering for its simplicity and speed, but this choice has limitations. One that immediately came to mind is that
audio features aren't independent—for example, 'pop' tracks tend to have higher popularity scores than 'a capella' tracks, and 'dance' tracks are higher energy. A decision-tree based approach (like Random Forest clustering or hierarchical methods) might better capture these feature interactions and non-linear relationships. Decision trees can also handle the mixed categorical/continuous nature of the data more naturally without manual encoding. To extend this application, I'd explore tree-based methods and dimensionality reduction (PCA/t-SNE) before clustering to see if they surface more meaningful musical groupings.

## Visualization
The tool provides an interactive dashboard with three main views:
1. **Cluster explorer**: Scatter plots showing song distributions across audio features from the original kaggle dataset (energy, valence, danceability, etc.). Hovering over each cluster displays a summary of its categorical information - the most common genre, mode, key, and time signature - as well 
as the number of tracks in each cluster. Clicking into a single cluster will bring up a histogram view, where users can chose which numeric feature
to see as a distribution.
2. **Cluster comparison**: Shift-clicking two clusters will bring up a scatterplot of the selected numeric features, so users can see a side-by-side
comparison of two clusters. I downsampled the number of tracks here for svg performance, only returning the most popular songs in each cluster.
3. **Similar tracks finder**: Search for any song in the dataset and get 10 acoustically similar recommendations. This includes an autocomplete suggestion to find real songs in the database

## Setup Notes
I ran into *some* kind of bug with the annoy library - with this dataset and
randomly generated data, the built index would always return a single
similar neighbor, always at index 1. I figure its an issue with a local 
C compiler on my machine or an environment issue, so I had claude step in
and fix the similarity generation with a sklearn version (`annoy_alternatives.py`). 
But, with a working annoy generated .ann file and the original library, the frontend would function the same.

## Extensions
A list of next steps:

1. **better typing in the backend!** Pydantic would be my choice here, as it plays well with FastAPI. 
Stricter return schemas would allow for clearer frontend components, which would
have their own corresponding schemas. This prevents the need for bespoke
mapping functions to unpack every URL return, and makes it easier to add new
backend routes.

2. **link outs to Spotify!** An obvious 'what next?' question that users have when viewing their analysis is comparison to other data, or deeper dives into sources. The suggestion tab could be extended to access the spotify API and create a suggested playlist for the user to listen to. 

3. **smarter filtering for similar songs!** I'm returning the 10 most similar songs from the approximate nearest neighbors algorithm, but other results users might want would be "give me a similar song I haven't heard" (aka return something less popular!) or "make me a workout playlist!" (return similar songs all with the same tempo). Determining drill downs and common query patterns by speaking with users would be the most informative next step here.

4. **hovers!** Within the scatterplots generated in browser, it would be great to have more detail. I could see this done by a configurable zoom to reduce the crowding in the frame, and then a mouseover/hover to show metadata about a particular track in the scatterplot. This would allow users to 
immediately identify outliers within a cluster, or see what songs seem to be emblematic of a particular grouping.

5. **database choices** I used duckdb to get something working quickly, but for a production application where we need to retrieve feature vectors,
a database specifically for vector storage would be more performant. This is also true for the autocomplete component - a solution like ElasticSearch
would be the better choice over duckdb.

## AI Disclosure
I worked with Claude/Anthropic chat (Opus 4.1) for this project. 
- **React code generation**: Used for initial component scaffolding (e.g., "give me a component that uses d3 to create a scatterplot"), then customized with app-specific routes and styling
- **Bug fixing**: E.g. Claude helped debug a flickering/re-rendering issue in my scatterplot component, which I resolved by wrapping the plot in a Chakra Flex component. 
- **Annoy workaround**: Used Claude Code in agent mode to generate a sklearn-based alternative when annoy produced buggy results in my environment

The KMeans clustering, data processing, and server code is homegrown. 