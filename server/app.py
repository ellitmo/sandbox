from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import duckdb
from annoy_alternatives import SklearnAnnoyReplacement as AnnoyIndex

app = FastAPI(title="D3 Data API")
DB_NAME = 'db.duckdb'

N_FEATURES = 15  # hardcoded, could have a server config file
index = None

numeric_vars = [
            'popularity',
            'danceability',
            'energy',
            'valence',
            'acousticness',
            'tempo',
            'loudness',
            'speechiness',
            'liveness',
            'instrumentalness'
        ]

categorical_vars = [
    'genre',
    'key',
    'mode',
    'time_signature'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def lazy_load_index():
    global index, N_FEATURES
    if index is not None:
        return
    index = AnnoyIndex(N_FEATURES, 'euclidean')
    index.load('tracks.pkl')

@app.get("/api/data/varnames")
async def get_varnames(numeric: bool = True):
    if numeric:
        return numeric_vars
    else:
        return categorical_vars

@app.get("/api/duckdb/clusters")
async def get_clusters() -> dict:
    try:
        with duckdb.connect(database=DB_NAME) as con:
            res = con.execute("SELECT id, x, y, size FROM cluster ORDER BY id").fetchall()

            if not res:
                return {}

            result_dict = {
                "id": {},
                "x": {},
                "y": {},
                "size": {} 
            }

            for i, (cluster_id, x, y, size) in enumerate(res):
                result_dict["id"][str(i)] = cluster_id
                result_dict["x"][str(i)] = x
                result_dict["y"][str(i)] = y
                result_dict["size"][str(i)] = size

            return result_dict

    except Exception as e:
        print(f"Database error: {e}")  # This will show in server logs
        return {}


@app.get("/api/duckdb/clusterstats/")
async def get_stats(cluster_id:int, var: str = 'popularity'):
    with duckdb.connect(database=DB_NAME) as con:
        query = f"""
                SELECT {var} as value FROM track t
                INNER JOIN track_to_cluster ttc ON ttc.track_id=t.track_id
                WHERE ttc.cluster_id={cluster_id}
                """
        res = con.execute(query).fetchall()
        values = [row[0] for row in res if row[0] is not None]
    return values


@app.get("/api/duckdb/cluster-averages")
async def get_cluster_averages(x_var: str = 'popularity', y_var: str = 'danceability'):
    try:
        if x_var not in numeric_vars or y_var not in numeric_vars:
            return {"error": f"Invalid variables. Must be one of: {numeric_vars}"}

        with duckdb.connect(database=DB_NAME) as con:
            query = f"""
                SELECT
                    ttc.cluster_id,
                    AVG(t.{x_var}) as avg_x,
                    AVG(t.{y_var}) as avg_y,
                FROM track t
                INNER JOIN track_to_cluster ttc ON ttc.track_id = t.track_id
                GROUP BY ttc.cluster_id
                ORDER BY ttc.cluster_id
            """
            res = con.execute(query).fetchall()

            cluster_averages = {}
            for cluster_id, avg_x, avg_y in res:
                cluster_averages[str(cluster_id)] = {
                    'x': float(avg_x) if avg_x is not None else 0,
                    'y': float(avg_y) if avg_y is not None else 0,
                }

            return {
                'x': x_var,
                'y': y_var,
                'clusters': cluster_averages
            }

    except Exception as e:
        print(f"Error in get_cluster_averages: {e}")
        return {"error": str(e)}


@app.get("/api/duckdb/compare")
async def compare(cluster_id1:int, cluster_id2, var1: str, var2: str) -> dict:
    if var1 not in numeric_vars or var2 not in numeric_vars:
        return {'error':'must select features that can produce scatterplot'}
    
    with duckdb.connect(database=DB_NAME) as con:
        query = f"""
            SELECT
                ttc.cluster_id,
                LIST(t.{var1}) as x_values,
                LIST(t.{var2}) as y_values
            FROM track t
            INNER JOIN track_to_cluster ttc ON ttc.track_id = t.track_id
            WHERE ttc.cluster_id IN ({cluster_id1}, {cluster_id2})
            GROUP BY ttc.cluster_id
            ORDER BY ttc.cluster_id
        """
        res = con.execute(query).fetchall()

    scatterplot_info = {}
    for row in res:
        cluster_id, x_values, y_values = row
        scatterplot_info[str(cluster_id)] = {
            'x': x_values,
            'y': y_values,
        }

    return {'clusters': scatterplot_info}

@app.get("/api/duckdb/suggest")
async def get_suggested_tracks(track_name) -> dict:
    if index is None:
        lazy_load_index()
        
    with duckdb.connect(database=DB_NAME) as con:
        res = con.execute(
            """
            SELECT tai.annoy_index, t.track_id
            FROM track_annoy_index tai
            INNER JOIN track t ON t.track_id = tai.track_id
            WHERE LOWER(t.track_name) = LOWER(?)
            ORDER BY t.popularity DESC
            LIMIT 1
            """,
            [track_name]
        ).fetchone()
        if not res:
            return []

    query_index, query_track_id = res
    print(f"Query annoy_index from DB: {query_index}")
    print(f"Total items in Annoy index: {index.get_n_items()}")
    similar_indices = index.get_nns_by_item(query_index, n=10)
    print(query_index, similar_indices)
    with duckdb.connect(database=DB_NAME) as con:
        indices_str = ','.join(map(str, similar_indices))
        result = con.execute(f"""
            SELECT 
                t.track_id,
                t.track_name,
                t.artist_name,
                t.popularity,
                tai.annoy_index
            FROM track_annoy_index tai
        INNER JOIN track t ON t.track_id = tai.track_id
        WHERE tai.annoy_index IN ({indices_str})
        AND tai.track_id != ?
        """, [query_track_id]).fetchall() 

    annoy_to_result = {row[4]: row for row in result}
    
    # Return results in Annoy's similarity order
    similar_tracks = []
    for idx in similar_indices:
        if idx in annoy_to_result and annoy_to_result[idx][0] != query_track_id:
            row = annoy_to_result[idx]
            similar_tracks.append({
                "track_id": row[0],
                "track_name": row[1],
                "artist_name": row[2],
                "popularity": row[3]
            })
            if len(similar_tracks) >= 10:
                break
    
    return {
        "query": track_name,
        "similar_tracks": similar_tracks
    }

@app.get("/api/duckdb/track/")
async def get_track_info(track_name: str):
    pass 

@app.get("/api/duckdb/autocomplete")
async def autocomplete(query:str, limit: int = 10) -> list:
    if not query or len(query) < 3:
        return []
    
    with duckdb.connect(database=DB_NAME) as con:
        results = con.execute(
            """
            SELECT DISTINCT track_name, artist_name, popularity
            FROM track
            WHERE LOWER(track_name) LIKE LOWER(?)
            ORDER BY popularity DESC
            LIMIT ?
            """,
            [f"%{query}%", limit]
        ).fetchall()
    
    return [
        {
            "track_name": row[0],
            "artist_name": row[1],
            "display": f"{row[0]} - {row[1]}"
        }
        for row in results
    ]

@app.get("/api/duckdb/categorical")
async def get_categorical_data() -> dict:
    with duckdb.connect(database=DB_NAME) as con:
        query = ",".join([f"mode({x})" for x in categorical_vars])
        res = con.execute(f"""
        SELECT
            ttc.cluster_id,
            {query}
        FROM track t
        INNER JOIN track_to_cluster ttc ON ttc.track_id = t.track_id
        GROUP BY ttc.cluster_id
        ORDER BY ttc.cluster_id
        """).fetchall()
    if not res:
        return {} # so we can make a blank box
    
    return {
            row[0]: {
            "categories": {
                cat:row[i+1] for i, cat in enumerate(categorical_vars)
            }
        }
        for row in res
    }
