package com.busgo.entity;

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

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "bus_performance", uniqueConstraints =
    @UniqueConstraint(columnNames = {"bus_id", "travel_date"}))
public class BusPerformance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "performance_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    @Column(name = "travel_date", nullable = false)
    private LocalDate travelDate;

    @Column(name = "scheduled_departure", nullable = false)
    private OffsetDateTime scheduledDeparture;

    @Column(name = "actual_departure")
    private OffsetDateTime actualDeparture;

    @Column(name = "scheduled_arrival", nullable = false)
    private OffsetDateTime scheduledArrival;

    @Column(name = "actual_arrival")
    private OffsetDateTime actualArrival;

    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    @Column(nullable = false)
    private boolean cancelled;

    public BusPerformance() {}
    public Long getId() { return id; }
    public Bus getBus() { return bus; }
    public Route getRoute() { return route; }
    public Schedule getSchedule() { return schedule; }
    public LocalDate getTravelDate() { return travelDate; }
    public OffsetDateTime getScheduledDeparture() { return scheduledDeparture; }
    public OffsetDateTime getActualDeparture() { return actualDeparture; }
    public OffsetDateTime getScheduledArrival() { return scheduledArrival; }
    public OffsetDateTime getActualArrival() { return actualArrival; }
    public Integer getDelayMinutes() { return delayMinutes; }
    public boolean isCancelled() { return cancelled; }
}
