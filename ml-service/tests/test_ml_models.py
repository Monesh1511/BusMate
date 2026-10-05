from app.main import analyze_review, predict_delay, recommend_buses


def _training_buses():
    return [
        {
            "id": index,
            "averageRating": 4.6 if index < 6 else 1.8,
            "averageFare": 650 + index * 20,
            "seatCapacity": 36 + index,
            "operatorRating": 4.5 if index < 6 else 2.5,
            "ac": index % 2 == 0,
            "sleeper": index % 3 == 0,
        }
        for index in range(12)
    ]


def _training_reviews():
    positive = {
        "reviewText": "clean comfortable seats and friendly staff arrived on time",
        "rating": 5,
        "cleanlinessRating": 5,
        "comfortRating": 5,
        "punctualityRating": 5,
        "staffRating": 5,
        "boardingRating": 5,
    }
    negative = {
        "reviewText": "dirty uncomfortable seats rude staff and late arrival",
        "rating": 1,
        "cleanlinessRating": 1,
        "comfortRating": 1,
        "punctualityRating": 1,
        "staffRating": 1,
        "boardingRating": 1,
    }
    return [positive.copy() for _ in range(6)] + [negative.copy() for _ in range(6)]


def test_recommendations_require_real_training_history():
    result = recommend_buses({"schedules": [{"id": 1, "fare": 600, "bus": {}}], "trainingBuses": []})

    assert result["status"] == "INSUFFICIENT_DATA"
    assert result["recommendations"] == []
    assert result["trainingRows"] == 0


def test_recommendations_fit_from_supplied_bus_and_review_history():
    schedules = [{
        "id": 101,
        "fare": 500,
        "routeMedianFare": 700,
        "bus": {
            "seatCapacity": 42,
            "operatorRating": 4.3,
            "ac": True,
            "sleeper": False,
        },
    }]

    result = recommend_buses({"schedules": schedules, "trainingBuses": _training_buses()})

    assert result["status"] == "READY"
    assert result["trainingRows"] == 12
    assert result["model"] == "bus-recommendation-logistic-v1"
    assert result["recommendations"][0]["scheduleId"] == 101


def test_delay_prediction_is_unavailable_without_performance_rows():
    result = predict_delay({"departureTime": "2026-10-01T18:00:00+05:30", "dayOfWeek": 4, "distanceKm": 350, "history": []})

    assert result["status"] == "INSUFFICIENT_DATA"
    assert result["predictedDelayMinutes"] is None
    assert result["trainingRows"] == 0


def test_delay_prediction_trains_from_performance_history():
    history = [
        {
            "departureTime": f"2026-10-{index + 1:02d}T{8 + index % 8:02d}:00:00+05:30",
            "dayOfWeek": index % 7 + 1,
            "distanceKm": 200 + index * 10,
            "delayMinutes": index * 3,
            "cancelled": False,
        }
        for index in range(12)
    ]

    result = predict_delay({"departureTime": "2026-10-30T20:00:00+05:30", "dayOfWeek": 5, "distanceKm": 320, "history": history})

    assert result["status"] == "READY"
    assert result["trainingRows"] == 12
    assert isinstance(result["predictedDelayMinutes"], int)


def test_review_analysis_requires_and_uses_database_review_training():
    missing = analyze_review({"text": "comfortable seats", "trainingReviews": []})
    assert missing["status"] == "INSUFFICIENT_DATA"
    assert missing["sentiment"] == "INSUFFICIENT_DATA"
    assert missing["aspects"] == []

    result = analyze_review({"text": "clean comfortable seat, friendly staff and on time", "trainingReviews": _training_reviews()})
    assert result["status"] == "READY"
    assert result["trainingRows"] == 12
    assert result["sentiment"] in {"POSITIVE", "NEGATIVE", "NEUTRAL"}
    assert {aspect["aspect"] for aspect in result["aspects"]} == {"cleanliness", "comfort", "punctuality", "staff", "boarding"}
