package com.busgo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "schedules", uniqueConstraints =
    @UniqueConstraint(columnNames = {"bus_id", "travel_date"}))
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Schedule {
    private static final ZoneId BUSGO_ZONE = ZoneId.of("Asia/Kolkata");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "boarding_point_id", nullable = false)
    private BoardingPoint boardingPoint;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dropping_point_id", nullable = false)
    private BoardingPoint droppingPoint;

    @Column(name = "travel_date", nullable = false)
    private LocalDate travelDate;

    @Column(name = "departure_time", nullable = false)
    private OffsetDateTime departureAt;

    @Column(name = "arrival_time", nullable = false)
    private OffsetDateTime arrivalAt;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fare;

    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED";

    public Schedule() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Bus getBus() { return bus; }
    public void setBus(Bus bus) { this.bus = bus; }
    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }
    public BoardingPoint getBoardingPoint() { return boardingPoint; }
    public void setBoardingPoint(BoardingPoint boardingPoint) { this.boardingPoint = boardingPoint; }
    public BoardingPoint getDroppingPoint() { return droppingPoint; }
    public void setDroppingPoint(BoardingPoint droppingPoint) { this.droppingPoint = droppingPoint; }
    public LocalDate getTravelDate() { return travelDate; }
    public void setTravelDate(LocalDate travelDate) { this.travelDate = travelDate; }

    public LocalTime getDepartureTime() {
        return departureAt == null ? null : departureAt.atZoneSameInstant(BUSGO_ZONE).toLocalTime();
    }

    public void setDepartureTime(LocalTime time) {
        this.departureAt = toTimestamp(time);
    }

    @JsonIgnore
    public OffsetDateTime getDepartureAt() { return departureAt; }

    public void setDepartureAt(OffsetDateTime departureAt) { this.departureAt = departureAt; }

    public LocalTime getArrivalTime() {
        return arrivalAt == null ? null : arrivalAt.atZoneSameInstant(BUSGO_ZONE).toLocalTime();
    }

    public void setArrivalTime(LocalTime time) {
        this.arrivalAt = toTimestamp(time);
    }

    @JsonIgnore
    public OffsetDateTime getArrivalAt() { return arrivalAt; }

    public void setArrivalAt(OffsetDateTime arrivalAt) { this.arrivalAt = arrivalAt; }

    public BigDecimal getFare() { return fare; }
    public void setFare(BigDecimal fare) { this.fare = fare; }
    public void setFare(Double fare) { this.fare = fare == null ? null : BigDecimal.valueOf(fare); }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isActive() { return "SCHEDULED".equals(status); }
    public void setActive(boolean active) { this.status = active ? "SCHEDULED" : "CANCELLED"; }

    private OffsetDateTime toTimestamp(LocalTime time) {
        if (time == null || travelDate == null) {
            return null;
        }
        return travelDate.atTime(time).atZone(BUSGO_ZONE).toOffsetDateTime();
    }
}
