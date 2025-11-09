from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import duckdb

app = FastAPI(title="D3 Data API")
DB_NAME = '/Users/lellithorpe/code/sandbox/db10k.duckdb'

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
# Add CORS middleware to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
                    COUNT(*) as track_count
                FROM track t
                INNER JOIN track_to_cluster ttc ON ttc.track_id = t.track_id
                GROUP BY ttc.cluster_id
                ORDER BY ttc.cluster_id
            """
            res = con.execute(query).fetchall()

            cluster_averages = {}
            for cluster_id, avg_x, avg_y, count in res:
                cluster_averages[str(cluster_id)] = {
                    'x': float(avg_x) if avg_x is not None else 0,
                    'y': float(avg_y) if avg_y is not None else 0,
                    'count': int(count)
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
async def compare(cluster_id:int, var1: str, var2: str):
    # return info for scatterplot
    pass

@app.get("/api/duckdb/track/")
async def get_track_info(track_name: str):
    pass 

@app.get("/api/autocomplete")
async def autocomplete(query:str):
    pass


@app.get("/api/data")
async def get_data():
    # Generate comprehensive fake gene expression data for d3 heatmap
    genes = [
        "BRCA1", "TP53", "EGFR", "KRAS", "PIK3CA", "PTEN", "APC", "BRAF",
        "CDKN2A", "RB1", "MYC", "ERBB2", "FGFR1", "IDH1", "MDM2", "CCND1",
        "CDK4", "VEGFA", "TERT", "NF1"
    ]

    data = []
    for gene in genes:
        tpm = round(abs(__import__('random').gauss(4.5, 2.5)), 2)  # Normal distribution, mean=4.5, std=2.5
        tpm = max(0.1, min(tpm, 15.0))  # Clamp between 0.1 and 15.0
        data.append({
            "gene": gene,
            "tpm": tpm,
            "metadata": "internal"
        })
    for gene in genes:
        tpm = round(abs(__import__('random').gauss(8.2, 4.0)), 2)  # Higher mean=8.2, more variation std=4.0
        tpm = max(0.5, min(tpm, 25.0))  # Clamp between 0.5 and 25.0
        data.append({
            "gene": gene,
            "tpm": tpm,
            "metadata": "public"
        })

    return {"results": data}