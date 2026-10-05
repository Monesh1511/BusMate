from typing import Any

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

app = FastAPI(title="BusGo ML Service", version="1.0.0")
MIN_TRAINING_ROWS = 10
ASPECT_COLUMNS = {
    "cleanliness": "cleanlinessRating",
    "comfort": "comfortRating",
    "punctuality": "punctualityRating",
    "staff": "staffRating",
    "boarding": "boardingRating",
}


class RecommendationRequest(BaseModel):
    schedules: list[dict[str, Any]] = Field(default_factory=list)
    trainingBuses: list[dict[str, Any]] = Field(default_factory=list)


class ReviewRequest(BaseModel):
    text: str = ""
    trainingReviews: list[dict[str, Any]] = Field(default_factory=list)


def _coerce_object(request: BaseModel | dict[str, Any]) -> dict[str, Any]:
    return request if isinstance(request, dict) else request.model_dump()


def _sentiment_label(rating: Any) -> str | None:
    try:
        numeric_rating = int(rating)
    except (TypeError, ValueError):
        return None
    if numeric_rating >= 4:
        return "POSITIVE"
    if numeric_rating <= 2:
        return "NEGATIVE"
    if numeric_rating == 3:
        return "NEUTRAL"
    return None


def _not_enough_data(model: str, message: str) -> dict[str, Any]:
    return {
        "status": "INSUFFICIENT_DATA",
        "model": model,
        "message": message,
    }


def _bus_features(bus: dict[str, Any], fare: Any) -> list[float] | None:
    try:
        fare_value = float(fare)
        capacity = float(bus["seatCapacity"])
        operator_rating = float(bus["operatorRating"])
    except (KeyError, TypeError, ValueError):
        return None
    if fare_value < 0 or capacity <= 0 or not 0 <= operator_rating <= 5:
        return None
    return [
        fare_value / 1000,
        capacity / 60,
        float(bool(bus.get("ac"))),
        float(bool(bus.get("sleeper"))),
        operator_rating / 5,
    ]


def recommendation_score(item: dict[str, Any], model: LogisticRegression) -> tuple[float, list[str]]:
    bus = item.get("bus") or {}
    features = _bus_features(bus, item.get("fare"))
    if features is None:
        raise ValueError("Schedule is missing real fare, capacity, or operator rating data")

    score = float(model.predict_proba([features])[0][1] * 100)
    reasons = ["Historical passenger feedback predicts a strong fit"]
    if bus.get("ac"):
        reasons.append("Air-conditioned bus")
    if bus.get("sleeper"):
        reasons.append("Sleeper seating")
    try:
        if float(item["fare"]) <= float(item["routeMedianFare"]):
            reasons.append("Fare is at or below this route's observed median")
    except (KeyError, TypeError, ValueError):
        pass
    return round(score, 1), reasons[:3]


@app.get("/ml/health")
def health() -> dict[str, str]:
    return {
        "status": "UP",
        "modelVersion": "busgo-demo-db-trained-v1",
        "trainingDataPolicy": "busgo_demo rows only; no synthetic training data",
    }


def _coerce_recommendation_request(request: RecommendationRequest | dict[str, Any]) -> dict[str, Any]:
    return _coerce_object(request)


@app.post("/ml/recommend/buses")
def recommend_buses(request: RecommendationRequest | dict[str, Any]) -> dict[str, Any]:
    payload = _coerce_recommendation_request(request)
    schedules = payload.get("schedules") or []
    if not schedules:
        return {
            **_not_enough_data("bus-recommendation-logistic-v1", "No live schedules are available for this search."),
            "recommendations": [],
        }

    training_rows = []
    labels = []
    for bus in payload.get("trainingBuses") or []:
        average_rating = bus.get("averageRating")
        if average_rating is None:
            continue
        label = _sentiment_label(average_rating)
        features = _bus_features(bus, bus.get("averageFare"))
        if label is None or features is None:
            continue
        training_rows.append(features)
        labels.append(1 if label == "POSITIVE" else 0)

    if len(training_rows) < MIN_TRAINING_ROWS or len(set(labels)) < 2:
        return {
            **_not_enough_data(
                "bus-recommendation-logistic-v1",
                f"Need at least {MIN_TRAINING_ROWS} buses with actual schedule, operator, and passenger-rating history before ranking recommendations.",
            ),
            "trainingRows": len(training_rows),
            "recommendations": [],
        }

    model = LogisticRegression(max_iter=500, class_weight="balanced", random_state=42)
    model.fit(np.asarray(training_rows, dtype=float), np.asarray(labels, dtype=int))

    recommendations = []
    for item in schedules:
        score, reasons = recommendation_score(item, model)
        recommendations.append({
            "scheduleId": item.get("id"),
            "score": score,
            "category": "MODEL_MATCH",
            "reasons": reasons,
        })
    recommendations.sort(key=lambda item: item["score"], reverse=True)
    return {
        "status": "READY",
        "model": "bus-recommendation-logistic-v1",
        "trainingRows": len(training_rows),
        "recommendations": recommendations,
    }


def _departure_hour(record: dict[str, Any]) -> int | None:
    value = str(record.get("departureTime") or "")
    try:
        return int(value.split("T")[-1].split(":")[0])
    except (TypeError, ValueError):
        return None


def _delay_features(record: dict[str, Any]) -> list[float] | None:
    hour = _departure_hour(record)
    try:
        day = float(record["dayOfWeek"])
        distance = float(record["distanceKm"])
        if hour is None or not 1 <= day <= 7 or distance <= 0:
            return None
        return [float(hour), day, distance / 100]
    except (KeyError, TypeError, ValueError):
        return None


@app.post("/ml/predict/delay")
def predict_delay(payload: dict[str, Any]) -> dict[str, Any]:
    training_rows = []
    targets = []
    for record in payload.get("history") or []:
        if record.get("cancelled") or record.get("delayMinutes") is None:
            continue
        features = _delay_features(record)
        try:
            target = float(record["delayMinutes"])
        except (TypeError, ValueError):
            continue
        if features is not None and target >= 0:
            training_rows.append(features)
            targets.append(target)

    if len(training_rows) < MIN_TRAINING_ROWS or len(set(targets)) < 2:
        return {
            **_not_enough_data(
                "bus-delay-gradient-boosting-v1",
                f"Need at least {MIN_TRAINING_ROWS} completed bus_performance records with observed delays for this route.",
            ),
            "predictedDelayMinutes": None,
            "confidence": "none",
            "trainingRows": len(training_rows),
        }

    query_features = _delay_features(payload)
    if query_features is None:
        return {
            **_not_enough_data("bus-delay-gradient-boosting-v1", "The schedule is missing valid time, day, or distance data."),
            "predictedDelayMinutes": None,
            "confidence": "none",
            "trainingRows": len(training_rows),
        }

    model = GradientBoostingRegressor(random_state=42, n_estimators=60, max_depth=2)
    model.fit(np.asarray(training_rows, dtype=float), np.asarray(targets, dtype=float))
    prediction = max(0, int(round(float(model.predict([query_features])[0]))))
    confidence = "medium" if len(training_rows) >= 30 else "low"
    return {
        "status": "READY",
        "predictedDelayMinutes": prediction,
        "confidence": confidence,
        "model": "bus-delay-gradient-boosting-v1",
        "trainingRows": len(training_rows),
        "disclaimer": "Estimated from completed bus_performance records in busgo_demo.",
    }


def _fit_text_model(reviews: list[dict[str, Any]], label_key: str) -> tuple[TfidfVectorizer, LogisticRegression, int] | None:
    texts = []
    labels = []
    for review in reviews:
        text = str(review.get("reviewText") or "").strip()
        label = _sentiment_label(review.get(label_key))
        if text and label:
            texts.append(text)
            labels.append(label)
    if len(texts) < MIN_TRAINING_ROWS or len(set(labels)) < 2:
        return None

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    model = LogisticRegression(max_iter=500, class_weight="balanced", random_state=42)
    model.fit(vectorizer.fit_transform(texts), labels)
    return vectorizer, model, len(texts)


def _coerce_review_request(request: ReviewRequest | dict[str, Any] | str) -> dict[str, Any]:
    if isinstance(request, str):
        return {"text": request}
    return _coerce_object(request)


@app.post("/ml/analyze/review")
def analyze_review(request: ReviewRequest | dict[str, Any] | str) -> dict[str, Any]:
    payload = _coerce_review_request(request)
    text = str(payload.get("text") or "").strip()
    reviews = payload.get("trainingReviews") or []
    overall_model = _fit_text_model(reviews, "rating")
    if overall_model is None:
        return {
            **_not_enough_data(
                "bus-review-tfidf-logistic-v1",
                f"Need at least {MIN_TRAINING_ROWS} real reviews with rating variation before review analysis is available.",
            ),
            "sentiment": "INSUFFICIENT_DATA",
            "aspects": [],
            "trainingRows": len(reviews),
        }

    if not text:
        return {
            **_not_enough_data("bus-review-tfidf-logistic-v1", "There is no review text to analyze."),
            "sentiment": "INSUFFICIENT_DATA",
            "aspects": [],
            "trainingRows": overall_model[2],
        }

    vectorizer, model, training_count = overall_model
    sentiment = model.predict(vectorizer.transform([text]))[0]
    aspects = []
    for aspect, rating_key in ASPECT_COLUMNS.items():
        aspect_model = _fit_text_model(reviews, rating_key)
        if aspect_model is None:
            continue
        aspect_vectorizer, classifier, _ = aspect_model
        aspects.append({"aspect": aspect, "sentiment": classifier.predict(aspect_vectorizer.transform([text]))[0]})

    status = "READY" if len(aspects) == len(ASPECT_COLUMNS) else "PARTIAL_DATA"
    return {
        "status": status,
        "sentiment": sentiment,
        "aspects": aspects,
        "model": "bus-review-tfidf-logistic-v1",
        "trainingRows": training_count,
        "disclaimer": "Models are fit from rated reviews in busgo_demo for each request.",
    }
