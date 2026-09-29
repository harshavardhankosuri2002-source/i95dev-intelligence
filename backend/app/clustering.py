import os
import sqlite3
import json
import pandas as pd
import numpy as np
from app.database import get_db_connection

CLUSTERING_FEATURES = [
    'engagement_score',
    'total_revenue',
    'open_pipeline_value',
    'days_since_last_interaction',
    'email_response_rate',
    'open_ticket_count',
    'avg_csat_score',
    'retention_risk_score'
]

# Native lightweight clustering implementation (zero scipy/sklearn dependencies for ultra-fast serverless execution)
def custom_standard_scaler(X):
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0)
    std = np.where(std == 0, 1.0, std)
    return (X - mean) / std

def custom_kmeans(X, k=5, max_iter=100, random_state=42):
    rng = np.random.RandomState(random_state)
    n_samples, n_features = X.shape
    centers = [X[rng.choice(n_samples)]]
    for _ in range(1, k):
        dist_sq = np.min([np.sum((X - c) ** 2, axis=1) for c in centers], axis=0)
        sum_sq = np.sum(dist_sq)
        probs = dist_sq / sum_sq if sum_sq > 0 else np.ones(n_samples) / n_samples
        centers.append(X[rng.choice(n_samples, p=probs)])
    centers = np.array(centers)

    labels = np.zeros(n_samples, dtype=int)
    for _ in range(max_iter):
        dists = np.linalg.norm(X[:, np.newaxis, :] - centers[np.newaxis, :, :], axis=2)
        new_labels = np.argmin(dists, axis=1)
        if np.array_equal(labels, new_labels):
            break
        labels = new_labels
        for j in range(k):
            mask = (labels == j)
            if np.any(mask):
                centers[j] = np.mean(X[mask], axis=0)
    return labels

def custom_silhouette_score(X, labels):
    n_samples = len(X)
    sample_size = min(300, n_samples)
    indices = np.random.RandomState(42).choice(n_samples, sample_size, replace=False)
    X_sub = X[indices]
    labels_sub = labels[indices]
    unique_labels = np.unique(labels_sub)
    if len(unique_labels) < 2:
        return 0.5
    scores = []
    for i in range(len(X_sub)):
        same = (labels_sub == labels_sub[i])
        if np.sum(same) <= 1:
            scores.append(0.0)
            continue
        a_i = np.mean(np.linalg.norm(X_sub[same] - X_sub[i], axis=1))
        b_i = np.inf
        for other in unique_labels:
            if other != labels_sub[i]:
                diff = (labels_sub == other)
                if np.any(diff):
                    b_i = min(b_i, np.mean(np.linalg.norm(X_sub[diff] - X_sub[i], axis=1)))
        max_ab = max(a_i, b_i)
        scores.append((b_i - a_i) / max_ab if max_ab > 0 else 0.0)
    return round(float(np.mean(scores)), 3)

def run_kmeans_clustering(k: int = 5):
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT * FROM customer_analytical_features", conn)
    
    if df.empty:
        conn.close()
        return {"error": "No analytical features found. Run feature engineering first."}

    X = df[CLUSTERING_FEATURES].to_numpy()
    
    # Scale features
    X_scaled = custom_standard_scaler(X)

    # Run KMeans with fixed seed for reproducibility
    labels = custom_kmeans(X_scaled, k=k, random_state=42)
    df['cluster_id'] = labels

    # Calculate Silhouette Score
    score = custom_silhouette_score(X_scaled, labels)

    # Analyze Cluster Characteristics to dynamically assign meaningful, data-driven labels
    cluster_stats = []
    assigned_labels = {}

    # Calculate overall dataset medians/means
    overall_mean_rev = df['total_revenue'].mean()
    overall_mean_pipe = df['open_pipeline_value'].mean()
    overall_mean_eng = df['engagement_score'].mean()
    overall_mean_risk = df['retention_risk_score'].mean()
    overall_mean_days = df['days_since_last_interaction'].mean()
    overall_mean_csat = df['avg_csat_score'].mean()

    # Score each cluster to determine its archetype
    temp_cluster_profiles = {}
    for c_id in range(k):
        sub = df[df['cluster_id'] == c_id]
        c_size = len(sub)
        mean_rev = sub['total_revenue'].mean()
        mean_pipe = sub['open_pipeline_value'].mean()
        mean_eng = sub['engagement_score'].mean()
        mean_risk = sub['retention_risk_score'].mean()
        mean_days = sub['days_since_last_interaction'].mean()
        mean_resp = sub['email_response_rate'].mean()
        mean_tickets = sub['open_ticket_count'].mean()
        mean_csat = sub['avg_csat_score'].mean()

        temp_cluster_profiles[c_id] = {
            "size": c_size,
            "mean_rev": mean_rev,
            "mean_pipe": mean_pipe,
            "mean_eng": mean_eng,
            "mean_risk": mean_risk,
            "mean_days": mean_days,
            "mean_resp": mean_resp,
            "mean_tickets": mean_tickets,
            "mean_csat": mean_csat
        }

    # Data-driven label heuristics
    used_labels = set()
    for c_id, prof in sorted(temp_cluster_profiles.items(), key=lambda x: x[1]['mean_risk'], reverse=True):
        # 1. Retention risk check
        if prof['mean_risk'] > 40.0 or prof['mean_tickets'] > 1.0 or prof['mean_csat'] < 3.2:
            label = "Retention & Support Risk"
            if label not in used_labels:
                assigned_labels[c_id] = label
                used_labels.add(label)
                continue

    for c_id, prof in sorted(temp_cluster_profiles.items(), key=lambda x: x[1]['mean_rev'], reverse=True):
        if c_id in assigned_labels:
            continue
        # 2. High revenue accounts
        if prof['mean_rev'] > overall_mean_rev * 1.2:
            label = "Engaged Growth Accounts" if prof['mean_eng'] > overall_mean_eng else "Existing Clients - Expansion Potential"
            if label not in used_labels:
                assigned_labels[c_id] = label
                used_labels.add(label)
                continue

    for c_id, prof in sorted(temp_cluster_profiles.items(), key=lambda x: x[1]['mean_pipe'], reverse=True):
        if c_id in assigned_labels:
            continue
        # 3. High pipeline accounts
        if prof['mean_pipe'] > overall_mean_pipe * 1.1:
            label = "High-Intent Prospects" if prof['mean_days'] < overall_mean_days else "Stalled Opportunities"
            if label not in used_labels:
                assigned_labels[c_id] = label
                used_labels.add(label)
                continue

    # Fallback for remaining clusters
    candidate_fallbacks = [
        "High-Intent Prospects",
        "Stalled Opportunities",
        "Existing Clients - Expansion Potential",
        "Engaged Growth Accounts",
        "Disengaged / Low Engagement Accounts",
        "Early Evaluation Prospects"
    ]
    for c_id in range(k):
        if c_id not in assigned_labels:
            for cand in candidate_fallbacks:
                if cand not in used_labels:
                    assigned_labels[c_id] = cand
                    used_labels.add(cand)
                    break
            if c_id not in assigned_labels:
                assigned_labels[c_id] = f"Behavioral Segment {c_id + 1}"

    df['cluster_label'] = df['cluster_id'].map(assigned_labels)

    # Compile cluster summary statistics
    for c_id in range(k):
        sub = df[df['cluster_id'] == c_id]
        lbl = assigned_labels[c_id]
        
        stat = {
            "cluster_id": c_id,
            "label": lbl,
            "account_count": len(sub),
            "percentage": round(len(sub) / len(df) * 100, 1),
            "total_revenue": round(float(sub['total_revenue'].sum()), 2),
            "avg_revenue": round(float(sub['total_revenue'].mean()), 2),
            "total_pipeline": round(float(sub['open_pipeline_value'].sum()), 2),
            "avg_pipeline": round(float(sub['open_pipeline_value'].mean()), 2),
            "avg_engagement_score": round(float(sub['engagement_score'].mean()), 1),
            "avg_retention_risk": round(float(sub['retention_risk_score'].mean()), 1),
            "avg_days_since_interaction": round(float(sub['days_since_last_interaction'].mean()), 1),
            "avg_response_rate": round(float(sub['email_response_rate'].mean() * 100), 1),
            "avg_csat": round(float(sub['avg_csat_score'].mean()), 2),
            "open_tickets": int(sub['open_ticket_count'].sum()),
            "distinguishing_features": [
                f"Engagement Score: {round(float(sub['engagement_score'].mean()), 1)}/100",
                f"Days Since Touch: {round(float(sub['days_since_last_interaction'].mean()), 1)} days",
                f"Avg Pipeline: ${round(float(sub['open_pipeline_value'].mean()), 0):,}",
                f"Email Response Rate: {round(float(sub['email_response_rate'].mean() * 100), 1)}%"
            ]
        }
        cluster_stats.append(stat)

    # Update database with persistent labels
    cursor = conn.cursor()
    update_data = [(df.loc[idx, 'cluster_id'], df.loc[idx, 'cluster_label'], df.loc[idx, 'customer_id']) for idx in df.index]
    cursor.executemany('''
    UPDATE customer_analytical_features
    SET cluster_id = ?, cluster_label = ?
    WHERE customer_id = ?
    ''', update_data)

    # Save cluster summary to metadata store
    cursor.execute('''
    INSERT OR REPLACE INTO metadata_store VALUES ('cluster_stats', ?)
    ''', (json.dumps(cluster_stats),))
    cursor.execute('''
    INSERT OR REPLACE INTO metadata_store VALUES ('current_k', ?)
    ''', (str(k),))
    cursor.execute('''
    INSERT OR REPLACE INTO metadata_store VALUES ('silhouette_score', ?)
    ''', (str(score),))

    # Firmographic vs Behavioral Comparison Matrix
    # Shows cross-tabulation of behavioral cluster vs Industry vertical
    cross_tab = pd.crosstab(df['cluster_label'], df['industry']).to_dict(orient='index')
    cursor.execute('''
    INSERT OR REPLACE INTO metadata_store VALUES ('cross_tab_industry', ?)
    ''', (json.dumps(cross_tab),))

    conn.commit()
    conn.close()

    return {
        "k": k,
        "silhouette_score": score,
        "clusters": cluster_stats,
        "comparison_industry": cross_tab
    }

def get_current_clustering():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM metadata_store WHERE key = 'cluster_stats'")
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return run_kmeans_clustering(k=5)

    stats = json.loads(row['value'])
    cursor.execute("SELECT value FROM metadata_store WHERE key = 'current_k'")
    k = int(cursor.fetchone()['value'])
    cursor.execute("SELECT value FROM metadata_store WHERE key = 'silhouette_score'")
    score = float(cursor.fetchone()['value'])
    cursor.execute("SELECT value FROM metadata_store WHERE key = 'cross_tab_industry'")
    cross_tab = json.loads(cursor.fetchone()['value'])
    conn.close()

    return {
        "k": k,
        "silhouette_score": score,
        "clusters": stats,
        "comparison_industry": cross_tab
    }

if __name__ == "__main__":
    res = run_kmeans_clustering(k=5)
    print(f"K-Means Clustering completed with k={res['k']}, Silhouette Score={res['silhouette_score']}")
    for c in res['clusters']:
        print(f" - [{c['cluster_id']}] {c['label']}: {c['account_count']} accounts ({c['percentage']}%)")
