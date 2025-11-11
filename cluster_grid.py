import pandas as pd
import numpy as np

def create_circular_layout(n_clusters, radius_base=5.0):
    if n_clusters <= 8:
        # Single ring
        angles = np.linspace(0, 2*np.pi, n_clusters, endpoint=False)
        positions = [(radius_base * np.cos(angle), radius_base * np.sin(angle))
                    for angle in angles]
    else:
        # Multi-ring layout
        inner_count = min(6, n_clusters // 2)
        outer_count = n_clusters - inner_count

        positions = []
        # Inner ring
        for i in range(inner_count):
            angle = 2 * np.pi * i / inner_count
            positions.append((3.0 * np.cos(angle), 3.0 * np.sin(angle)))

        # Outer ring
        for i in range(outer_count):
            angle = 2 * np.pi * i / outer_count
            positions.append((6.0 * np.cos(angle), 6.0 * np.sin(angle)))

    return positions

def generate_cluster_positions_df(cluster_labels, n_clusters):
    """
    Generate a DataFrame with cluster ID, x, y positions for DuckDB storage.
    """

    positions = create_circular_layout(n_clusters)

    cluster_sizes = []
    for i in range(n_clusters):
        size = np.sum(cluster_labels == i)
        cluster_sizes.append(size)

    cluster_df = pd.DataFrame({
        'cluster_id': list(range(n_clusters)),
        'x_position': [pos[0] for pos in positions],
        'y_position': [pos[1] for pos in positions],
        'cluster_size': cluster_sizes
    })

    return cluster_df