import pandas as pd
import numpy as np
import math


def generate_cluster_positions_df(cluster_labels, n_clusters, layout_type='circular'):
    """
    Generate a DataFrame with cluster ID, x, y positions for DuckDB storage.

    Parameters:
    -----------
    cluster_labels : array-like
        Array of cluster assignments for each data point
    n_clusters : int
        Number of clusters
    layout_type : str
        'circular', 'grid', or 'force_directed'

    Returns:
    --------
    pd.DataFrame with columns: cluster_id, x_position, y_position, cluster_size
    """

    def create_circular_layout(n_clusters, radius_base=5.0):
        """Arrange clusters in circular/multi-ring pattern"""
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

    def create_grid_layout(n_clusters, spacing=4.0):
        """Arrange clusters in a grid pattern"""
        cols = math.ceil(math.sqrt(n_clusters))
        rows = math.ceil(n_clusters / cols)

        positions = []
        for i in range(n_clusters):
            row = i // cols
            col = i % cols
            x = col * spacing - (cols-1) * spacing / 2
            y = row * spacing - (rows-1) * spacing / 2
            positions.append((x, y))

        return positions

    def create_force_directed_layout(n_clusters):
        """Create positions that maximize separation"""
        # Use golden ratio spiral for optimal separation
        golden_angle = np.pi * (3 - np.sqrt(5))
        positions = []

        for i in range(n_clusters):
            angle = i * golden_angle
            radius = 2 + i * 0.5  # Increasing radius
            x = radius * np.cos(angle)
            y = radius * np.sin(angle)
            positions.append((x, y))

        return positions

    # Generate positions based on layout type
    if layout_type == 'circular':
        positions = create_circular_layout(n_clusters)
    elif layout_type == 'grid':
        positions = create_grid_layout(n_clusters)
    elif layout_type == 'force_directed':
        positions = create_force_directed_layout(n_clusters)
    else:
        raise ValueError("layout_type must be 'circular', 'grid', or 'force_directed'")

    # Calculate cluster sizes
    cluster_sizes = []
    for i in range(n_clusters):
        size = np.sum(cluster_labels == i)
        cluster_sizes.append(size)

    # Create DataFrame
    cluster_df = pd.DataFrame({
        'cluster_id': list(range(n_clusters)),
        'x_position': [pos[0] for pos in positions],
        'y_position': [pos[1] for pos in positions],
        'cluster_size': cluster_sizes
    })

    return cluster_df


# Usage example (uncomment to use):
# cluster_positions_df = generate_cluster_positions_df(
#     cluster_labels=df['cluster_labels'].values,
#     n_clusters=best_cluster_n,
#     layout_type='circular'  # or 'grid' or 'force_directed'
# )
# print(cluster_positions_df)