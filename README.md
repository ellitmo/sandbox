## Quickstart
If you have conda installed, run `make venv` to stand up initial environment
and `make install` to install both pip and node packages. 

To generate the database and load in the spotify track data + clustering artifacts,
run `python setup_db.py`. This will do some light pre-processing, run a KMeans
algorithm and an Approximate Nearest Neighbors algorithm and load relevant 
results into duckdb and a file titled `tracks.ann`

Now just run `make app` and navigate to [localhost](http://localhost:5173)!