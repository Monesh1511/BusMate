package com.busgo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.OneToOne;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    @JsonIgnore
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    @JsonIgnore
    private Bus bus;

    @Column(nullable = false)
    private Integer rating;

    @Column(name = "cleanliness_rating", nullable = false)
    private Integer cleanlinessRating;

    @Column(name = "comfort_rating", nullable = false)
    private Integer comfortRating;

    @Column(name = "punctuality_rating", nullable = false)
    private Integer punctualityRating;

    @Column(name = "staff_rating", nullable = false)
    private Integer staffRating;

    @Column(name = "boarding_rating", nullable = false)
    private Integer boardingRating;

    @Column(name = "review_title", nullable = false, length = 150)
    private String title;

    @Column(name = "review_text", nullable = false, columnDefinition = "text")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now(ZoneOffset.UTC);

    @Transient
    private String reviewerName;

    public Review() {}
    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }
    public Bus getBus() { return bus; }
    public void setBus(Bus bus) { this.bus = bus; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Integer getCleanlinessRating() { return cleanlinessRating; }
    public void setCleanlinessRating(Integer cleanlinessRating) { this.cleanlinessRating = cleanlinessRating; }
    public Integer getComfortRating() { return comfortRating; }
    public void setComfortRating(Integer comfortRating) { this.comfortRating = comfortRating; }
    public Integer getPunctualityRating() { return punctualityRating; }
    public void setPunctualityRating(Integer punctualityRating) { this.punctualityRating = punctualityRating; }
    public Integer getStaffRating() { return staffRating; }
    public void setStaffRating(Integer staffRating) { this.staffRating = staffRating; }
    public Integer getBoardingRating() { return boardingRating; }
    public void setBoardingRating(Integer boardingRating) { this.boardingRating = boardingRating; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getReviewerName() {
        if (reviewerName != null) return reviewerName;
        return user == null ? null : user.getName();
    }

    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
}
