-- BusGo demo data seed for the verified busgo_demo schema.
--
-- This script:
--   * never deletes or updates rows;
--   * never changes table definitions or populated master tables;
--   * omits all identity columns;
--   * is safe to run again (each insert has a deterministic duplicate guard).
--
-- Run with psql, for example:
--   \i 'C:/path/to/003_busgo_complete_seed.sql'

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL search_path TO busgo_demo, public;

CREATE TEMP TABLE seed_routes (
    source_city varchar(60) NOT NULL,
    destination_city varchar(60) NOT NULL,
    route_id integer NOT NULL,
    PRIMARY KEY (source_city, destination_city)
) ON COMMIT DROP;

CREATE TEMP TABLE seed_schedules (
    schedule_id bigint NOT NULL PRIMARY KEY,
    bus_id integer NOT NULL,
    route_id integer NOT NULL,
    travel_date date NOT NULL,
    departure_time timestamptz NOT NULL,
    arrival_time timestamptz NOT NULL,
    fare numeric(10,2) NOT NULL,
    source_city varchar(60) NOT NULL,
    destination_city varchar(60) NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE seed_bookings (
    booking_id bigint NOT NULL PRIMARY KEY,
    booking_reference varchar(30) NOT NULL UNIQUE,
    user_id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    bus_id integer NOT NULL,
    fare numeric(10,2) NOT NULL,
    booking_status varchar(20) NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE seed_passengers (
    booking_id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    seat_id bigint NOT NULL,
    passenger_name varchar(100) NOT NULL,
    age integer NOT NULL,
    gender varchar(10) NOT NULL,
    phone varchar(20),
    email varchar(150),
    PRIMARY KEY (booking_id, seat_id)
) ON COMMIT DROP;

-- 1. Routes: 420 deterministic ordered city pairs from the existing cities.
INSERT INTO routes (source_city, destination_city, distance_km, estimated_duration_minutes)
SELECT source_city,
       destination_city,
       250 + ((pair_no * 37) % 1251),
       240 + ((pair_no * 19) % 901)
FROM (
    SELECT c1.city_name AS source_city,
           c2.city_name AS destination_city,
           row_number() OVER (ORDER BY c1.city_name, c2.city_name) AS pair_no
    FROM cities c1
    CROSS JOIN cities c2
    WHERE c1.city_name <> c2.city_name
) pairs
WHERE pair_no <= 420
  AND NOT EXISTS (
      SELECT 1
      FROM routes r
      WHERE r.source_city = pairs.source_city
        AND r.destination_city = pairs.destination_city
  );

INSERT INTO seed_routes (source_city, destination_city, route_id)
SELECT source_city, destination_city, route_id
FROM routes
WHERE source_city <> destination_city
ORDER BY source_city, destination_city;

-- 2. Seats: create exactly bus.seat_capacity seats for every existing bus.
INSERT INTO seats (
    bus_id, seat_number, seat_type, row_number, column_number, deck
)
SELECT b.bus_id,
       CASE
           WHEN b.sleeper THEN
               CASE WHEN seat_no % 2 = 1
                    THEN 'L' || ((seat_no + 1) / 2)::text
                    ELSE 'U' || (seat_no / 2)::text
               END
           ELSE seat_no::text
       END,
       CASE
           WHEN b.sleeper THEN 'SLEEPER'
           WHEN seat_no % 4 IN (1, 0) THEN 'WINDOW'
           ELSE 'AISLE'
       END,
       ((seat_no - 1) / 2) + 1,
       ((seat_no - 1) % 2) + 1,
       CASE
           WHEN b.sleeper AND seat_no % 2 = 1 THEN 'LOWER'
           WHEN b.sleeper THEN 'UPPER'
           ELSE 'MAIN'
       END
FROM buses b
CROSS JOIN LATERAL generate_series(1, b.seat_capacity) AS generated(seat_no)
WHERE NOT EXISTS (
    SELECT 1
    FROM seats s
    WHERE s.bus_id = b.bus_id
      AND s.seat_number = CASE
          WHEN b.sleeper THEN
              CASE WHEN generated.seat_no % 2 = 1
                   THEN 'L' || ((generated.seat_no + 1) / 2)::text
                   ELSE 'U' || (generated.seat_no / 2)::text
              END
          ELSE generated.seat_no::text
      END
);

-- 3. Schedules: five dates per active bus, including past and future trips.
--    The unique bus/travel_date key makes reruns harmless.
INSERT INTO schedules (
    bus_id, route_id, travel_date, departure_time, arrival_time, fare,
    boarding_point_id, dropping_point_id, status
)
SELECT b.bus_id,
       r.route_id,
       d.travel_date,
       d.departure_time,
       d.departure_time + (r.estimated_duration_minutes || ' minutes')::interval,
       round((650 + (r.distance_km * 1.65) + ((b.bus_id * 17) % 450))::numeric, 2),
       bp.point_id,
       dp.point_id,
       CASE WHEN d.travel_date < CURRENT_DATE THEN 'COMPLETED' ELSE 'SCHEDULED' END
FROM buses b
JOIN LATERAL (
    SELECT sr.route_id,
           sr.source_city,
           sr.destination_city,
           row_number() OVER (ORDER BY sr.route_id) AS route_no
    FROM seed_routes sr
) chosen_route
  ON chosen_route.route_no = ((b.bus_id - 1) % 420) + 1
JOIN routes r ON r.route_id = chosen_route.route_id
JOIN LATERAL (
    VALUES
        (CURRENT_DATE - 180, ((CURRENT_DATE - 180)::timestamp + time '06:00')
            AT TIME ZONE 'Asia/Kolkata'),
        (CURRENT_DATE - 90, ((CURRENT_DATE - 90)::timestamp + time '21:30')
            AT TIME ZONE 'Asia/Kolkata'),
        (CURRENT_DATE - 30, ((CURRENT_DATE - 30)::timestamp + time '14:00')
            AT TIME ZONE 'Asia/Kolkata'),
        (CURRENT_DATE + 7, ((CURRENT_DATE + 7)::timestamp + time '07:30')
            AT TIME ZONE 'Asia/Kolkata'),
        (CURRENT_DATE + 30, ((CURRENT_DATE + 30)::timestamp + time '22:00')
            AT TIME ZONE 'Asia/Kolkata')
) d(travel_date, departure_time) ON true
JOIN LATERAL (
    SELECT point_id
    FROM boarding_points
    WHERE city_name = r.source_city
    ORDER BY point_id
    LIMIT 1
) bp ON true
JOIN LATERAL (
    SELECT point_id
    FROM boarding_points
    WHERE city_name = r.destination_city
    ORDER BY point_id
    LIMIT 1
) dp ON true
WHERE b.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM schedules existing_schedule
      WHERE existing_schedule.bus_id = b.bus_id
        AND existing_schedule.travel_date = d.travel_date
  );

INSERT INTO seed_schedules (
    schedule_id, bus_id, route_id, travel_date, departure_time, arrival_time,
    fare, source_city, destination_city
)
SELECT s.schedule_id, s.bus_id, s.route_id, s.travel_date, s.departure_time,
       s.arrival_time, s.fare, r.source_city, r.destination_city
FROM schedules s
JOIN routes r ON r.route_id = s.route_id;

-- 4. Cancellation policies: four policies for every generated schedule.
INSERT INTO cancellation_policies (
    schedule_id, hours_before_departure, refund_percentage
)
SELECT ss.schedule_id, policy.hours_before_departure, policy.refund_percentage
FROM seed_schedules ss
CROSS JOIN (
    VALUES (48, 100), (24, 75), (6, 50), (0, 0)
) policy(hours_before_departure, refund_percentage)
WHERE NOT EXISTS (
    SELECT 1
    FROM cancellation_policies cp
    WHERE cp.schedule_id = ss.schedule_id
      AND cp.hours_before_departure = policy.hours_before_departure
);

-- 5. Bookings: 800 historical demo bookings using existing users and schedules.
--    Two seats/passengers are assigned to every booking below.
WITH candidates AS (
    SELECT ss.*,
           u.user_id,
           row_number() OVER (ORDER BY ss.schedule_id, u.user_id) AS booking_no
    FROM seed_schedules ss
    CROSS JOIN LATERAL (
        SELECT user_id
        FROM users
        ORDER BY user_id
        LIMIT 1
        OFFSET ((ss.schedule_id % 1902)::integer)
    ) u
    WHERE ss.travel_date < CURRENT_DATE
),
chosen AS (
    SELECT *
    FROM candidates
    WHERE booking_no <= 800
)
INSERT INTO bookings (
    booking_reference, user_id, schedule_id, booking_date, total_amount,
    booking_status, payment_status, cancelled_at
)
SELECT 'DEMO-' || lpad(booking_no::text, 6, '0'),
       user_id,
       schedule_id,
       departure_time - ((10 + (booking_no % 35)) || ' days')::interval,
       round((fare * 2)::numeric, 2),
       CASE WHEN booking_no % 20 IN (0, 1) THEN 'CANCELLED' ELSE 'COMPLETED' END,
       CASE WHEN booking_no % 20 IN (0, 1) THEN 'REFUNDED' ELSE 'PAID' END,
       CASE WHEN booking_no % 20 IN (0, 1)
            THEN departure_time - ((booking_no % 5 + 1) || ' days')::interval
            ELSE NULL
       END
FROM chosen
WHERE NOT EXISTS (
    SELECT 1
    FROM bookings existing_booking
    WHERE existing_booking.booking_reference = 'DEMO-' || lpad(booking_no::text, 6, '0')
);

INSERT INTO seed_bookings (
    booking_id, booking_reference, user_id, schedule_id, bus_id, fare, booking_status
)
SELECT b.booking_id, b.booking_reference, b.user_id, b.schedule_id,
       ss.bus_id, ss.fare, b.booking_status
FROM bookings b
JOIN seed_schedules ss ON ss.schedule_id = b.schedule_id
WHERE b.booking_reference LIKE 'DEMO-%';

-- 6. Passengers: two synthetic passengers per generated booking.
INSERT INTO seed_passengers (
    booking_id, schedule_id, seat_id, passenger_name, age, gender, phone, email
)
SELECT sb.booking_id,
       sb.schedule_id,
       seat.seat_id,
       'Demo Passenger ' || lpad(sb.booking_id::text, 6, '0') || '-' || seat.seat_no,
       22 + ((sb.booking_id + seat.seat_no) % 46)::integer,
       CASE WHEN seat.seat_no % 3 = 0 THEN 'OTHER'
            WHEN seat.seat_no % 2 = 0 THEN 'FEMALE'
            ELSE 'MALE'
       END,
       '90000' || lpad(((sb.booking_id + seat.seat_no) % 100000)::text, 5, '0'),
       'demo.' || sb.booking_id || '.' || seat.seat_no || '@example.test'
FROM seed_bookings sb
JOIN LATERAL (
    SELECT s.seat_id, row_number() OVER (ORDER BY s.seat_id)::integer AS seat_no
    FROM seats s
    WHERE s.bus_id = sb.bus_id
    ORDER BY s.seat_id
    LIMIT 2
) seat ON true
WHERE NOT EXISTS (
    SELECT 1
    FROM passengers existing_passenger
    WHERE existing_passenger.booking_id = sb.booking_id
      AND existing_passenger.seat_id = seat.seat_id
);

INSERT INTO passengers (
    booking_id, passenger_name, age, gender, seat_id, phone, email
)
SELECT booking_id, passenger_name, age, gender, seat_id, phone, email
FROM seed_passengers sp
WHERE NOT EXISTS (
    SELECT 1
    FROM passengers existing_passenger
    WHERE existing_passenger.booking_id = sp.booking_id
      AND existing_passenger.seat_id = sp.seat_id
);

-- 7. Booking seats: link each passenger to the same schedule and seat.
INSERT INTO booking_seats (
    booking_id, schedule_id, seat_id, passenger_id, is_active
)
SELECT sp.booking_id,
       sp.schedule_id,
       sp.seat_id,
       p.passenger_id,
       CASE WHEN sb.booking_status = 'CANCELLED' THEN false ELSE true END
FROM seed_passengers sp
JOIN passengers p
  ON p.booking_id = sp.booking_id
 AND p.seat_id = sp.seat_id
JOIN seed_bookings sb ON sb.booking_id = sp.booking_id
WHERE NOT EXISTS (
    SELECT 1
    FROM booking_seats existing_booking_seat
    WHERE existing_booking_seat.booking_id = sp.booking_id
      AND existing_booking_seat.seat_id = sp.seat_id
);

-- 8. Payments: one payment per generated booking.
INSERT INTO payments (
    booking_id, amount, payment_method, payment_status, transaction_ref,
    paid_at, refund_amount, refunded_at
)
SELECT sb.booking_id,
       round((sb.fare * 2)::numeric, 2),
       CASE sb.booking_id % 5
           WHEN 0 THEN 'UPI'
           WHEN 1 THEN 'CREDIT_CARD'
           WHEN 2 THEN 'DEBIT_CARD'
           WHEN 3 THEN 'NET_BANKING'
           ELSE 'WALLET'
       END,
       CASE WHEN sb.booking_status = 'CANCELLED' THEN 'REFUNDED' ELSE 'PAID' END,
       'DEMO-TXN-' || lpad(sb.booking_id::text, 12, '0'),
       CASE WHEN sb.booking_status = 'CANCELLED' THEN NULL
            ELSE CURRENT_TIMESTAMP - ((sb.booking_id % 120) || ' days')::interval
       END,
       CASE WHEN sb.booking_status = 'CANCELLED'
            THEN round((sb.fare * 2 * 0.50)::numeric, 2)
            ELSE 0
       END,
       CASE WHEN sb.booking_status = 'CANCELLED'
            THEN CURRENT_TIMESTAMP - ((sb.booking_id % 60) || ' days')::interval
            ELSE NULL
       END
FROM seed_bookings sb
WHERE NOT EXISTS (
    SELECT 1
    FROM payments existing_payment
    WHERE existing_payment.booking_id = sb.booking_id
);

-- 9. Reviews: one review for each non-cancelled demo booking, capped at 600.
INSERT INTO reviews (
    user_id, booking_id, bus_id, rating, cleanliness_rating, comfort_rating,
    punctuality_rating, staff_rating, boarding_rating, review_title,
    review_text, created_at
)
SELECT sb.user_id,
       sb.booking_id,
       sb.bus_id,
       CASE WHEN sb.booking_id % 10 IN (0, 1) THEN 3
            WHEN sb.booking_id % 5 = 0 THEN 4
            ELSE 5
       END,
       CASE WHEN sb.booking_id % 7 = 0 THEN 3 ELSE 4 + (sb.booking_id % 2)::integer END,
       CASE WHEN sb.booking_id % 6 = 0 THEN 3 ELSE 4 + (sb.booking_id % 2)::integer END,
       CASE WHEN sb.booking_id % 10 IN (0, 1) THEN 2
            WHEN sb.booking_id % 4 = 0 THEN 4
            ELSE 5
       END,
       CASE WHEN sb.booking_id % 8 = 0 THEN 3 ELSE 4 END,
       CASE WHEN sb.booking_id % 9 = 0 THEN 3 ELSE 4 + (sb.booking_id % 2)::integer END,
       CASE WHEN sb.booking_id % 10 IN (0, 1) THEN 'Comfortable ride with a delay'
            WHEN sb.booking_id % 4 = 0 THEN 'Good value and friendly staff'
            ELSE 'Clean and comfortable journey'
       END,
       CASE WHEN sb.booking_id % 10 IN (0, 1)
            THEN 'The seats were comfortable and the staff was polite, but the bus departed late and the Wi-Fi was unreliable.'
            WHEN sb.booking_id % 4 = 0
            THEN 'Boarding was smooth, the bus was clean, and the charging point worked well. Good value for the fare.'
            ELSE 'The bus was clean, comfortable, and punctual. The staff handled boarding efficiently and the ride was pleasant.'
       END,
       CURRENT_TIMESTAMP - ((sb.booking_id % 180) || ' days')::interval
FROM seed_bookings sb
WHERE sb.booking_status <> 'CANCELLED'
  AND sb.booking_id IN (
      SELECT booking_id
      FROM seed_bookings
      WHERE booking_status <> 'CANCELLED'
      ORDER BY booking_id
      LIMIT 600
  )
  AND NOT EXISTS (
      SELECT 1
      FROM reviews existing_review
      WHERE existing_review.booking_id = sb.booking_id
  );

-- 10. Performance: one record per generated bus/date, with correlated delays.
INSERT INTO bus_performance (
    bus_id, route_id, schedule_id, travel_date, scheduled_departure,
    actual_departure, scheduled_arrival, actual_arrival, delay_minutes, cancelled
)
SELECT ss.bus_id,
       ss.route_id,
       ss.schedule_id,
       ss.travel_date,
       ss.departure_time,
       CASE WHEN ss.schedule_id % 100 = 0 THEN NULL
            ELSE ss.departure_time + (
                CASE WHEN ss.schedule_id % 25 = 0 THEN 75
                     WHEN ss.schedule_id % 9 = 0 THEN 30
                     ELSE (ss.schedule_id % 16)
                END || ' minutes'
            )::interval
       END,
       ss.arrival_time,
       CASE WHEN ss.schedule_id % 100 = 0 THEN NULL
            ELSE ss.arrival_time + (
                CASE WHEN ss.schedule_id % 25 = 0 THEN 75
                     WHEN ss.schedule_id % 9 = 0 THEN 30
                     ELSE (ss.schedule_id % 16)
                END || ' minutes'
            )::interval
       END,
       CASE WHEN ss.schedule_id % 100 = 0 THEN NULL
            WHEN ss.schedule_id % 25 = 0 THEN 75
            WHEN ss.schedule_id % 9 = 0 THEN 30
            ELSE (ss.schedule_id % 16)::integer
       END,
       ss.schedule_id % 100 = 0
FROM seed_schedules ss
WHERE NOT EXISTS (
    SELECT 1
    FROM bus_performance existing_performance
    WHERE existing_performance.bus_id = ss.bus_id
      AND existing_performance.travel_date = ss.travel_date
);

-- Sequence repair is not needed: all identity columns were omitted.
COMMIT;

-- Validation: counts and orphan checks.
SELECT 'routes' AS table_name, count(*) AS row_count FROM busgo_demo.routes
UNION ALL SELECT 'schedules', count(*) FROM busgo_demo.schedules
UNION ALL SELECT 'seats', count(*) FROM busgo_demo.seats
UNION ALL SELECT 'bookings', count(*) FROM busgo_demo.bookings
UNION ALL SELECT 'booking_seats', count(*) FROM busgo_demo.booking_seats
UNION ALL SELECT 'passengers', count(*) FROM busgo_demo.passengers
UNION ALL SELECT 'payments', count(*) FROM busgo_demo.payments
UNION ALL SELECT 'reviews', count(*) FROM busgo_demo.reviews
UNION ALL SELECT 'bus_performance', count(*) FROM busgo_demo.bus_performance
UNION ALL SELECT 'cancellation_policies', count(*) FROM busgo_demo.cancellation_policies
ORDER BY table_name;

SELECT 'orphan_bookings' AS check_name, count(*) AS violations
FROM busgo_demo.bookings b
LEFT JOIN busgo_demo.schedules s ON s.schedule_id = b.schedule_id
WHERE s.schedule_id IS NULL
UNION ALL
SELECT 'orphan_schedules', count(*)
FROM busgo_demo.schedules s
LEFT JOIN busgo_demo.buses b ON b.bus_id = s.bus_id
LEFT JOIN busgo_demo.routes r ON r.route_id = s.route_id
WHERE b.bus_id IS NULL OR r.route_id IS NULL
UNION ALL
SELECT 'orphan_seats', count(*)
FROM busgo_demo.seats s
LEFT JOIN busgo_demo.buses b ON b.bus_id = s.bus_id
WHERE b.bus_id IS NULL
UNION ALL
SELECT 'orphan_passengers', count(*)
FROM busgo_demo.passengers p
LEFT JOIN busgo_demo.bookings b ON b.booking_id = p.booking_id
LEFT JOIN busgo_demo.seats s ON s.seat_id = p.seat_id
WHERE b.booking_id IS NULL OR s.seat_id IS NULL
UNION ALL
SELECT 'orphan_booking_seats', count(*)
FROM busgo_demo.booking_seats bs
LEFT JOIN busgo_demo.bookings b ON b.booking_id = bs.booking_id
LEFT JOIN busgo_demo.schedules s ON s.schedule_id = bs.schedule_id
LEFT JOIN busgo_demo.seats seat ON seat.seat_id = bs.seat_id
LEFT JOIN busgo_demo.passengers p ON p.passenger_id = bs.passenger_id
WHERE b.booking_id IS NULL
   OR s.schedule_id IS NULL
   OR seat.seat_id IS NULL
   OR p.passenger_id IS NULL
UNION ALL
SELECT 'orphan_payments', count(*)
FROM busgo_demo.payments p
LEFT JOIN busgo_demo.bookings b ON b.booking_id = p.booking_id
WHERE b.booking_id IS NULL
UNION ALL
SELECT 'orphan_reviews', count(*)
FROM busgo_demo.reviews r
LEFT JOIN busgo_demo.bookings b ON b.booking_id = r.booking_id
LEFT JOIN busgo_demo.users u ON u.user_id = r.user_id
LEFT JOIN busgo_demo.buses bus ON bus.bus_id = r.bus_id
WHERE b.booking_id IS NULL OR u.user_id IS NULL OR bus.bus_id IS NULL
UNION ALL
SELECT 'orphan_performance', count(*)
FROM busgo_demo.bus_performance bp
LEFT JOIN busgo_demo.buses b ON b.bus_id = bp.bus_id
LEFT JOIN busgo_demo.routes r ON r.route_id = bp.route_id
WHERE b.bus_id IS NULL OR r.route_id IS NULL
ORDER BY check_name;

SELECT 'invalid_booking_seat_bus' AS check_name, count(*) AS violations
FROM busgo_demo.booking_seats bs
JOIN busgo_demo.bookings b ON b.booking_id = bs.booking_id
JOIN busgo_demo.schedules s ON s.schedule_id = bs.schedule_id
JOIN busgo_demo.seats seat ON seat.seat_id = bs.seat_id
WHERE b.schedule_id <> bs.schedule_id
   OR s.bus_id <> seat.bus_id;
