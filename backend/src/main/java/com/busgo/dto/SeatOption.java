package com.busgo.dto;

public class SeatOption {
    private final Long id;
    private final String seatNumber;
    private final String seatType;
    private final Integer rowNumber;
    private final Integer columnNumber;
    private final String deck;
    private final boolean available;

    public SeatOption(Long id, String seatNumber, String seatType, Integer rowNumber,
                      Integer columnNumber, String deck, boolean available) {
        this.id = id;
        this.seatNumber = seatNumber;
        this.seatType = seatType;
        this.rowNumber = rowNumber;
        this.columnNumber = columnNumber;
        this.deck = deck;
        this.available = available;
    }

    public Long getId() { return id; }
    public String getSeatNumber() { return seatNumber; }
    public String getSeatType() { return seatType; }
    public Integer getRowNumber() { return rowNumber; }
    public Integer getColumnNumber() { return columnNumber; }
    public String getDeck() { return deck; }
    public boolean isAvailable() { return available; }
}
