import duckdb
from server.annoy_alternatives import SklearnAnnoyReplacement as AnnoyIndex
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from cluster_grid import generate_cluster_positions_df
import numpy as np
import pandas as pd

DB_NAME = "server/db.duckdb"
CSV_NAME = "SpotifyFeatures.csv"
INDEX_PATH = "server/tracks.pkl"

def create_db() -> pd.DataFrame:
    print("Building duckdb database...")
    spotify_df = preprocess()
    with duckdb.connect(database=DB_NAME) as con:
        con.execute("CREATE TABLE IF NOT EXISTS track AS SELECT * FROM spotify_df")
        con.execute("ALTER TABLE track ADD PRIMARY KEY (track_id)")
        con.execute("CREATE TABLE IF NOT EXISTS cluster (id INTEGER PRIMARY KEY, x FLOAT, y FLOAT, size FLOAT)")
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS track_to_cluster
            (track_id VARCHAR, cluster_id INTEGER,
            FOREIGN KEY (track_id) REFERENCES track (track_id),
            FOREIGN KEY (cluster_id) REFERENCES cluster (id))
            """
            )
        con.execute("""
            CREATE TABLE IF NOT EXISTS track_annoy_index
            (annoy_index INTEGER PRIMARY KEY, track_id VARCHAR)
        """)
    return spotify_df

def preprocess() -> pd.DataFrame:
    spotify_df = pd.read_csv(CSV_NAME)
    spotify_df = spotify_df.drop_duplicates(subset=["track_id"], keep="first")
    spotify_df = spotify_df[spotify_df["popularity"] > 10]
    return spotify_df

def kmeans(spotify_df: pd.DataFrame, n_clusters: int = 12) -> tuple[pd.DataFrame, np.ndarray]:
    df: pd.DataFrame = spotify_df.set_index('track_id').drop(columns=['artist_name','track_name'])
    categorical_df = df.select_dtypes(exclude=['number']).columns
    def encode(column: pd.Series):
        unique_vals = column.unique()
        encoding_map = {col: i for i,col in enumerate(unique_vals)}
        column = column.map(encoding_map)
        return column

    df = df.apply(lambda x: encode(x) if x.name in categorical_df else x)
    scaler = StandardScaler()
    df_znorm = scaler.fit_transform(df)
    print("Beginning KMeans clustering...")
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    cluster = kmeans.fit(df_znorm)
    df["cluster_labels"] = kmeans.labels_

    cluster_info = generate_cluster_positions_df(df['cluster_labels'], n_clusters=n_clusters)
    cluster_info = cluster_info.rename(columns={'cluster_id':'id', 'x_position':'x', 'y_position':'y','cluster_size':'size'})
    print("Logging cluster artifacts...")
    with duckdb.connect(database=DB_NAME) as con:
        con.execute("INSERT INTO cluster BY NAME SELECT * FROM cluster_info")

    trackdf = df[['cluster_labels']].reset_index().rename(columns={'cluster_labels':'cluster_id'})
    with duckdb.connect(database=DB_NAME) as con:
        con.execute("INSERT INTO track_to_cluster BY NAME SELECT * FROM trackdf")

    return df, df_znorm

def annoy(features_znorm: np.ndarray, track_ids:list[str], n_trees: int = 10):
    n_features = features_znorm.shape[1]

    index = AnnoyIndex(n_features, 'angular')  # This will use cosine distance internally
    print(len(track_ids))

    for i, track_id in enumerate(track_ids):
        vector = features_znorm[i]
        if len(vector.shape) > 1:
            vector = vector.flatten()
        index.add_item(i, vector)

    index.build(n_trees)
    index.save(INDEX_PATH)
    mapping_df = pd.DataFrame({'annoy_index': range(len(track_ids)), 'track_id': track_ids})
    with duckdb.connect(database=DB_NAME) as con:
        con.execute("INSERT INTO track_annoy_index BY NAME SELECT * FROM mapping_df")


def main():
    df = create_db()
    feature_df, features_znorm = kmeans(df, n_clusters=12)
    track_ids = feature_df.index.tolist()
    annoy(features_znorm=features_znorm, track_ids=track_ids)

if __name__ == '__main__':
    main()
