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
@Table(name = "seats", uniqueConstraints =
    @UniqueConstraint(columnNames = {"bus_id", "seat_number"}))
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seat_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @Column(name = "seat_number", nullable = false, length = 10)
    private String seatNumber;

    @Column(name = "seat_type", nullable = false, length = 20)
    private String seatType;

    @Column(name = "row_number", nullable = false)
    private Integer rowNumber;

    @Column(name = "column_number", nullable = false)
    private Integer columnNumber;

    @Column(nullable = false, length = 10)
    private String deck;

    public Seat() {}
    public Long getId() { return id; }
    public Bus getBus() { return bus; }
    public void setBus(Bus bus) { this.bus = bus; }
    public String getSeatNumber() { return seatNumber; }
    public String getSeatType() { return seatType; }
    public Integer getRowNumber() { return rowNumber; }
    public Integer getColumnNumber() { return columnNumber; }
    public String getDeck() { return deck; }
}
