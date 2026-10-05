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

@Entity
@Table(name = "cancellation_policies", uniqueConstraints =
    @UniqueConstraint(columnNames = {"schedule_id", "hours_before_departure"}))
public class CancellationPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cancellation_policy_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(name = "hours_before_departure", nullable = false)
    private Integer hoursBeforeDeparture;

    @Column(name = "refund_percentage", nullable = false)
    private Integer refundPercentage;

    public CancellationPolicy() {}
    public Long getId() { return id; }
    public Schedule getSchedule() { return schedule; }
    public Integer getHoursBeforeDeparture() { return hoursBeforeDeparture; }
    public Integer getRefundPercentage() { return refundPercentage; }
}
