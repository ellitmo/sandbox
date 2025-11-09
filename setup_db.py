import duckdb
DB_NAME = "db.duckdb"


def main():
    """
    Create initial tables for spotify tracks
    """
    with duckdb.connect(database=DB_NAME) as con:
        con.execute("""
                    CREATE TABLE track 
                    (
                    id VARCHAR PRIMARY KEY,
                    artist VARCHAR,
                    name VARCHAR,

                    )
                    """
        )
        con.execute("CREATE TABLE cluster (id INTEGER PRIMARY KEY, x FLOAT, y FLOAT)")
        con.execute(
            """
            CREATE TABLE track_to_cluster 
            (track_id VARCHAR, cluster_id INTEGER, 
            FOREIGN KEY (track_id) REFERENCES track (id),
            FOREIGN KEY (cluster_id) REFERENCES cluster (id))
            """
            )
        
if __name__ == "__main__":
    main()