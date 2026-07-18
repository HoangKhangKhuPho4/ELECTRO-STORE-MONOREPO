import sys
import os

# Add the root directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.model_store import load_model
from app.services.recommend import _compute_explanation_scores, _baseline_ui

def test_explain_matches_predict():
    print("Loading model...")
    model = load_model()
    if not model:
        print("Model not found. Please train first.")
        return

    algo = model.algo
    trainset = algo.trainset

    # Pick a test user who has ratings
    test_user_inner = None
    for i in range(trainset.n_users):
        if len(trainset.ur[i]) > 0:
            test_user_inner = i
            break

    if test_user_inner is None:
        print("No users with ratings found.")
        return

    test_user_raw = int(trainset.to_raw_uid(test_user_inner))
    print(f"Testing with user raw_id: {test_user_raw} (inner_id: {test_user_inner})")

    # Get data needed for explanation
    global_mean = float(trainset.global_mean)
    rated_items_inner = trainset.ur[test_user_inner]
    rated_items_set = {iid for iid, _ in rated_items_inner}

    # 1. Run our newly fixed manual explanation calculation
    print("Running manual _compute_explanation_scores...")
    predictions_explain, _ = _compute_explanation_scores(
        algo=algo,
        trainset=trainset,
        inner_uid=test_user_inner,
        rated_items_inner=rated_items_inner,
        rated_items_set=rated_items_set,
        global_mean=global_mean,
        k=40  # Surprise KNNBasic default is 40
    )
    
    # Convert list of tuples (inner_iid, est) to dict for easy lookup
    explain_est_map = {inner_iid: est for inner_iid, est in predictions_explain}

    # 2. Run Surprise's built-in algo.predict
    print("Running Surprise algo.predict for comparison...")
    max_diff = 0.0
    diff_count = 0
    total_compared = 0

    for inner_iid in range(trainset.n_items):
        if inner_iid in rated_items_set:
            continue
            
        raw_iid = int(trainset.to_raw_iid(inner_iid))
        # Surprise prediction
        surprise_pred = algo.predict(uid=test_user_raw, iid=raw_iid)
        surprise_est = float(surprise_pred.est)
        
        # Manual prediction
        manual_est = explain_est_map.get(inner_iid)
        
        if manual_est is None:
            # If manual loop didn't compute it, it defaults to baseline b_ui
            b_i = _baseline_ui(algo, test_user_inner, inner_iid, global_mean)
            manual_est = max(1.0, min(5.0, b_i.b_ui))
            
        diff = abs(surprise_est - manual_est)
        total_compared += 1
        
        if diff > max_diff:
            max_diff = diff
            
        if diff > 1e-6:
            diff_count += 1
            if diff_count <= 5:
                print(f"  Mismatch found on item {raw_iid}: Surprise={surprise_est:.6f}, Manual={manual_est:.6f}, Diff={diff:.6f}")

    print(f"\n--- TEST RESULTS ---")
    print(f"Total items compared: {total_compared}")
    print(f"Maximum difference: {max_diff:.10f}")
    
    if max_diff < 1e-6:
        print("✅ SUCCESS: Manual Explain formula matches Surprise KNNBaseline perfectly (diff < 1e-6)!")
    else:
        print(f"❌ FAILED: Found {diff_count} items with diff > 1e-6.")

if __name__ == '__main__':
    test_explain_matches_predict()
